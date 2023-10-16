function Safify(myString) {
    return myString.replace(/\//g, '_').replace(/\+/g, '-');
}

module.exports = Safify;