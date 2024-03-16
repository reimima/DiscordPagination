import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
} from 'discord.js';
import { Logger } from 'log4js';

const generate = (current: number, total: number): ButtonBuilder[] => {
    const disable = {
        previous: !!(current <= 1),
        next: !!(current >= total),
    };

    return [
        new ButtonBuilder()
            .setCustomId('head')
            .setLabel('⏪')
            .setStyle(ButtonStyle.Success)
            .setDisabled(disable.previous),

        new ButtonBuilder()
            .setCustomId('previous')
            .setLabel('◀')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disable.previous),

        new ButtonBuilder()
            .setCustomId('-')
            .setLabel(`${current} / ${total}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),

        new ButtonBuilder()
            .setCustomId('next')
            .setLabel('▶')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disable.next),

        new ButtonBuilder()
            .setCustomId('tail')
            .setLabel('⏩')
            .setStyle(ButtonStyle.Success)
            .setDisabled(disable.next),
    ];
};

export const pagination = async (
    logger: Logger,
    interaction: ChatInputCommandInteraction,
    pages: EmbedBuilder[],
    defer?: boolean,
    options = {
        time: 60_000,
        ephemeral: false,
    },
) => {
    let current = 1;
    const _pages: EmbedBuilder[] = [];

    let index = 0;
    for (const page of pages) {
        index++;

        const json = page.toJSON();
        const template = `Page ${index} / ${pages.length}`;

        if (json.footer) {
            _pages.push(
                // @ts-expect-error
                page.setFooter({
                    text: `${template} - ${json.footer.text}`,
                    iconURL: json.footer.icon_url ?? undefined,
                }),
            );

            continue;
        }

        _pages.push(page.setFooter({ text: template }));
    }

    const message = await interaction[defer ? 'followUp' : 'reply']({
        embeds: [new EmbedBuilder(pages[current - 1]?.toJSON())],
        components: [
            new ActionRowBuilder<ButtonBuilder>().setComponents(generate(current, _pages.length)),
        ],
        ephemeral: options.ephemeral,
    });
    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: _collected => _collected.user.id === interaction.user.id,
        time: options.time,
        idle: 15_000,
    });

    collector.on('collect', async collected => {
        await collected.update({ content: null });

        try {
            switch (collected.customId) {
                case 'head':
                    current = 1;

                    await interaction.editReply({
                        embeds: [new EmbedBuilder(pages[0]?.toJSON())],
                        components: [
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                generate(1, _pages.length),
                            ),
                        ],
                    });
                    break;

                case 'previous':
                    await interaction.editReply({
                        embeds: [new EmbedBuilder(pages[current - 2]?.toJSON())],
                        components: [
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                generate(current - 1, _pages.length),
                            ),
                        ],
                    });

                    current--;
                    break;

                case 'next':
                    await interaction.editReply({
                        embeds: [new EmbedBuilder(pages[current]?.toJSON())],
                        components: [
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                generate(current + 1, _pages.length),
                            ),
                        ],
                    });

                    current++;
                    break;

                case 'tail':
                    current = _pages.length;

                    await interaction.editReply({
                        embeds: [new EmbedBuilder(pages.slice(-1)[0]?.toJSON())],
                        components: [
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                generate(current, _pages.length),
                            ),
                        ],
                    });
                    break;
            }
        } catch (e) {
            logger.error(e);

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('An Error Occured When Sending A Message')
                        .setDescription(
                            'An error has occurred, please retry and report to the official.',
                        ),
                ],
                components: [],
            });
        }
    });

    collector.once('end', async () => {
        const disabled: ButtonBuilder[] = generate(current, _pages.length).map(button =>
            button.setDisabled(true),
        );

        await interaction.editReply({
            components: [new ActionRowBuilder<ButtonBuilder>().addComponents(disabled)],
        });
    });
};
