import Ember from 'ember';
import BaseController from '../base-controller';

export default BaseController.extend({
    needs: ['spider'],
    queryParams: 'url',
    url: null,

    queryUrl: function() {
        if (!this.url) {
            return;
        }
        this.fetchQueryUrl();
    }.observes('url'),

    fetchQueryUrl: function() {
        var url = this.url;
        this.set('url', null);
        Ember.run.next(this, function() {
            this.get('controllers.spider').fetchPage(url, null, true);
        });
    },

    _breadCrumb: null,

    willEnter: function() {
        this._super();
        if (this.url) {
            this.fetchQueryUrl();
        }
    }
});
