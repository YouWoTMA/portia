import {
  moduleForComponent,
  test
} from 'ember-qunit';
import Ember from 'ember';

moduleForComponent('tool-box', 'ToolBoxComponent', {
  // specify the other units that are required for this test
  needs: ['component:pin-toolbox-button']
});

test('it renders', function() {
  expect(2);

  // creates the component instance
  var component = this.subject({
    router: {
      router: {
        currentHandlerInfos: []
      }
    },
  });
  component.set('controllers.lastObject', Ember.Object.create({}));
  equal(component._state, 'preRender');

  // appends the component to the page
  this.append();
  equal(component._state, 'inDOM');
});
