import Ember from 'ember';
import { ElementSprite } from '../../utils/canvas';
import SpriteStore from '../../utils/sprite-store';

var predictionHelper = DomPredictionHelper.prototype;
var $ = Ember.$;
var rgba = (r,g,b,a=0.4) => 'rgba(' + [r, g, b, a].join(', ') + ')';

export default Ember.Component.extend({
    tagName: 'div',
    selected: new Ember.Set([]),
    restricted: new Ember.Set([]),
    matches: new Ember.Set([]),
    colors: {
        matched: rgba(0xee, 0xff, 0xee),
        selected: rgba(0x90, 0xff, 0x99, 0.6),
        restricted: rgba(0xff, 0x90, 0x90),
        select: rgba(0x90, 0xff, 0x90, 0.9),
        restrict: rgba(0xff, 0x90, 0x90, 0.9),
    },

    init: function(){
        this.set('documentView.listener', this);
    },
    sprites: function(){
        var restricted = this.restricted.map((elm) => {
            return ElementSprite.create({
                element: elm,
                fillColor: this.colors.restricted
            });
        });
        var matched = this.matches.map((elm) => {
            return ElementSprite.create({
                element: elm,
                fillColor: this.selected.contains(elm) ? this.colors.selected : this.colors.matched
            });
        });
        return restricted.concat(matched);
    }.property('selected', 'restricted', 'matches'),

    update: function(){
        var selected = $(this.selected), restricted = $(this.restricted);
        var selector = predictionHelper.predictCss(selected, restricted);
        this.set('matches', new Ember.Set(this.get('documentView').getIframe().find(selector)));
        this.set('documentView.sprites', this);
        this.get('documentView').redrawNow();
    },

    documentActions: {
        elementSelected: function(element) {
            if(this.matches.contains(element)) {
                this.selected.remove(element); // If it's there at all
                this.restricted.add(element);
            } else if (this.restricted.contains(element)) {
                this.restricted.remove(element);
            } else {
                this.selected.add(element);
            }
            this.update();
        },
        elementHovered: function(elm) {
            var sprite = this.get('documentView.hoveredSprite');
            var matched = this.matches.contains(elm);
            sprite.fillColor = matched ? this.colors.restrict : this.colors.select;
        },
    }
});


