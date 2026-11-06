const escapeLike = (value) => String(value).replace(/[\\%_]/g, (ch) => `\\${ch}`);

module.exports = escapeLike;
