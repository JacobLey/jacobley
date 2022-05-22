'use strict';

const readPackage = pkg => {

    // Rivendell is installed locally and is best to use for "latest",
    // but executable is not immediately available in CI, so we installed latest version as well.
    if (pkg.name === 'rivendell' && pkg.dist) {
        // From npm, rename executable as rivendell-dist
        pkg.bin['rivendell-dist'] = pkg.bin.rivendell;
        delete pkg.bin.rivendell;
    }
    return pkg;
};

module.exports = {
    hooks: {
        readPackage,
    },
};
