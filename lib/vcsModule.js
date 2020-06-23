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
  async onMongoDBAction(action, itemCollection, oldData, newData) {
    const diff = newData ? DeepDiff(oldData, newData) : DeepDiff({}, oldData);
    this.emit(`change:${itemCollection}`, {
      action,
      diff,
      itemCollection,
      itemId: oldData._id
    });
  }
  async saveRevision(itemId, diff) {
    // note we access the MongoDB API directly to avoid an infinite event loop
    return this.db.getCollection(this.collectionName).updateOne({ itemId }, {
      $set: { itemId },
      $push: { revisions: { diff, timestamp: new Date().toISOString() } }
    }, { upsert: true });
  }
  async getRevisions(itemId) {
    const [revisions] = await this.db.find(this.collectionName, { itemId });
    return revisions;
  }
  async revertToRevision(itemId, revisionId) {
    const [itemData] = await this.db.find(this.collectionName, { itemId });
    if(!itemData) {
      throw new Error('Unknown revision');
    }
    console.log(itemData);
    // DeepDiff.applyChange(target, change);
  }
}

module.exports = VCSModule;