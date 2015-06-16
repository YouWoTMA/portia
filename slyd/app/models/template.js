import SimpleModel from './simple-model';

export default SimpleModel.extend({
    serializedProperties: ['page_id', 'default', 'scrapes', 'page_type', 'url',
        'annotations', 'extractors', 'name', 'plugins', 'selectors'],
    page_id: '',
    scrapes: 'default',
    page_type: 'item',
    url: '',
    annotated_body: '',
    original_body: '',
    _new: false,
    extractors: null,

    selectorList: [], // List of added selectors [{field: field, query: selector}]
    selectors: function(key, value){ // List of selectors that has been added. {fieldName: selector}
        if(arguments.length > 1) { // Setter
            this.set('selectorList', Object.keys(value).map(x => ({field: x, query: value[x]})));
        }
        var res = {};
        this.get('selectorList').forEach(function(selector){
            res[selector.field] = selector.query;
        });
        return res;
    }.property('selectorList', 'selectorList@each'),
});
