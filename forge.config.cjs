module.exports = {
  packagerConfig: {
    executableName: 'hc-ssh',
    icon: './public/Logo.png',
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'hc_ssh',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32'],
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
      },
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          name: 'hc-ssh',
          productName: 'HC-SSH Manager',
          maintainer: 'HC-SSH Team',
          homepage: 'https://example.com',
          categories: ['Utility', 'TerminalEmulator'],
          description: 'A modern SSH terminal manager with script support.',
          section: 'utils',
          priority: 'optional',
        },
      },
    },
  ],
};
