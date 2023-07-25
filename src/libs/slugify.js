const slugify = (str,symbol=" ") => {
    return str.replace(/[^a-zA-Z0-9-]/g, symbol).toLowerCase();
};

module.exports =  slugify