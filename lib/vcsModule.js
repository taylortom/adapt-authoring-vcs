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
      oldData,
      newData,
      itemCollection,
      itemId: oldData._id
    });
  }
  async saveRevision(data) {
    console.log(`VCSModule#saveRevision:`, data);
    const [itemData] = await this.db.find(this.collectionName, { itemId: data.itemId });
    // note we access the MongoDB API directly to avoid an infinite event loop
    const coll = this.db.getCollection(this.collectionName);
    if(!itemData) return coll.insertOne(data);
    coll.updateOne({ itemId: itemData._id }, { $push: { revisions: data } });
  }
  async getRevisions(itemId) {
    return this.db.find(this.collectionName, { itemId });
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