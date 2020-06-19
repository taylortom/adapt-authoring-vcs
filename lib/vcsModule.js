const DeepDiff = require('deep-diff');
const { AbstractModule } = require('adapt-authoring-core');

class VCSModule extends AbstractModule {
  /** @override */
  constructor(app, pkg) {
    super(app, pkg);
    this.init();
  }
  async init() {
    this.collectionName = 'revisions';
    this.db = await this.app.waitForModule('mongodb');

    ['insert','update','replace','delete'].forEach(a => {
      this.db.on(a, (...d) => this.onMongoDBAction(a, ...d));
    });
    this.setReady();
  }
  async onMongoDBAction(action, collection, oldData, newData) {
    const diff = newData ? DeepDiff(oldData, newData) : DeepDiff({}, oldData);
    if(diff) await this.saveRevision({ action, diff, itemId: oldData._id, itemCollection: collection });
  }
  async saveRevision(data) {
    console.log(`VCSModule[${action}]:`, diff || 'no difference');
    // access MongoDB API directly to avoid an infinite event loop
    this.db.getCollection(this.collectionName).insert(data);
  }
  async revertToRevision() {
    // this.db.find();
    // DeepDiff.applyChange(target, change);
  }
}

module.exports = VCSModule;