import Ember from 'ember';
import { ElementSprite } from '../utils/canvas';

var predictionHelper = DomPredictionHelper.prototype;
var $ = Ember.$;

var rgba = (r,g,b,a=0.4) => 'rgba(' + [r, g, b, a].join(', ') + ')';
var colors = {
    matched: rgba(0x99, 0xff, 0x99),
    selected: rgba(0x30, 0xff, 0x30, 0.9),
    restricted: rgba(0xff, 0x90, 0x90),
    select: rgba(0x90, 0xff, 0x90, 0.9),
    restrict: rgba(0xff, 0x90, 0x90, 0.9),
};

export default Ember.Component.extend({
    tagName: 'div',

    selected: new Set(), // List of elements that the user has selected and should match
    restricted: new Set(), // List of elements that the user has restricted and shouldn't match
    matches: new Set(), // List of elements the selector matches
    selector: '', // Current working selector
    selectorIsGuessed: false, // If selector has been guessed or typed by the user

    sprites: function(){
        var restricted = Array.from(this.restricted, (elm) => {
            return ElementSprite.create({
                element: elm,
                fillColor: colors.restricted
            });
        });
        var matched = Array.from(this.matches, (elm) => {
            return ElementSprite.create({
                element: elm,
                fillColor: this.selected.has(elm) ? colors.selected : colors.matched
            });
        });
        return restricted.concat(matched);
    }.property('selected', 'restricted', 'matches'),

    update: function(){
        var selected = $(Array.from(this.selected)), restricted = $(Array.from(this.restricted));
        var selector = predictionHelper.predictCss(selected, restricted);
        this.set('selector', selector);
        this.selectorIsGuessed = true;
        this.set('matches', new Set(this.get('documentView').getIframe().find(selector).toArray()));
        this.get('documentView').redrawNow();
    },

    cssSelectorPreviewNow: function(){
        var selector = this.get('selector');
        var documentView = this.get('documentView');
        try {
            var elements = documentView.getIframe().find(selector);
            this.set('cssSelectorValid', true);
            this.set('matches', new Set(elements.toArray()));
        } catch(e){
            this.set('cssSelectorValid', false);
        }
    },

    stopAddSelector: function(){
        this.set('addingSelector', false);
        this.set('fieldName', '');
        this.set('selector', '');
        this.set('selected', new Set());
        this.set('restricted', new Set());
        this.set('matches', new Set());
        this.selectorIsGuessed = false;
        this.unlistenDocumentActions();
    },

    actions: {
        cssSelectorPreview: function(){
            this.set('selected', new Set());
            this.set('restricted', new Set());
            this.selectorIsGuessed = false;
            Ember.run.debounce(this, this.cssSelectorPreviewNow, 500);
        },

        newSelector: function(){
            this.set('addingSelector', true);
            this.listenDocumentActions();
        },
        cancel: function(){
            this.stopAddSelector();
        },
        addSelector: function(){
            var field = this.get('fieldName');
            if(!field) {
                return alert('Please specify the field name');
            }
            if(field in this.get('model.selectors')){
                return alert('Duplicated field');
            }
            this.get('model.selectorList').push({field: field, query: this.get('selector')});
            this.stopAddSelector();
        },
        removeSelector: function(selector) {
            var selectorList = this.get('model.selectorList');
            selectorList.removeObject(selectorList.findBy('field', selector));
        }
    },

    listenDocumentActions: function(){
        if(!this.get('oldDocviewListener')) {
            this.set('oldDocviewListener', this.get('documentView.listener'));
            this.set('oldDocviewSprites', this.get('documentView.sprites'));
        }
        this.set('documentView.listener', this);
        this.set('documentView.sprites', this);
    },

    unlistenDocumentActions: function(){
        if(this.get('oldDocviewListener')){
            this.set('documentView.listener', this.get('oldDocviewListener'));
            this.set('documentView.sprites', this.get('oldDocviewSprites'));
            this.set('oldDocviewListener', null);
            this.set('oldDocviewSprites', null);
        }
    },

    documentActions: {
        elementSelected: function(element) {
            if(this.selectorIsGuessed && this.matches.has(element)) {
                this.selected.delete(element); // If it's there at all
                this.restricted.add(element);
            } else if (this.restricted.has(element)) {
                this.restricted.delete(element);
            } else {
                this.selected.add(element);
            }
            this.update();
        },
        elementHovered: function(elm) {
            var sprite = this.get('documentView.hoveredSprite');
            var matched = this.selectorIsGuessed && this.matches.has(elm);
            sprite.fillColor = matched ? colors.restrict : colors.select;
        },
    }
});

