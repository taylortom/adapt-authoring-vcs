const { AbstractModule } = require('adapt-authoring-core');

class VCSModule extends AbstractModule {
  /** @override */
  constructor(app, pkg) {
    super(app, pkg);
    this.init();
  }
  async init() {
    this.setReady();
  }
}

module.exports = VCSModule;
