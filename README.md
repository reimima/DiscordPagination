# DiscordPagination
Discord embed pagination created with [discord.js](https://github.com/discordjs/discord.js).

[discord.js](https://github.com/discordjs/discord.js) で作られた埋め込みページネーションです。

# 注意
- コード単体しかありません。
- 必要なライブラリは `discord.js` と `typescript` です。
- ロガーライブラリ `log4js` は `console` で代用できます。
- [L72](https://github.com/reimima/DiscordPagination/blob/main/index.ts#L72) のエラー回避は `tsconfig.json` による `exactOptionalPropertyTypes` が要因です。
  `false` に指定すれば必要ありません。

# ライセンス
このコードはMITライセンスの下で公開されています。
