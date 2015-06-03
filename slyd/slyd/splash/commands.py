import hashlib
import json
import re

from scrapy.http import Request
from scrapy.item import DictItem

from splash.browser_tab import JsError

from .utils import clean, page, open_tab


_VIEWPORT_RE = re.compile('^\d{3,5}x\d{3,5}$')


@open_tab
def load_page(data, socket):
    """Load page in virtual url from provided url"""
    if 'url' not in data:
        return {'error': 4001, 'message': 'Requires parameter url'}

    socket.tab.loaded = False
    def on_complete(error):
        extra_meta = {'id': data.get('_meta', {}).get('id')}
        if error:
            extra_meta.update(error=4500, message='Unknown error')
        else:
            socket.tab.loaded = True
        print "on_complete", error, extra_meta
        socket.sendMessage(metadata(socket, extra_meta))

    socket.tab.go(data['url'], lambda: on_complete(False), lambda: on_complete(True))

@open_tab
def interact_page(data, socket):
    """Execute JS event from front end on virtual tab"""
    event = json.dumps(data.get('interaction', {}))
    try:
        socket.tab.evaljs('window.livePortiaPage.interact(%s);' % event)
    except JsError, e:
        print e


def metadata(socket, extra={}):
    socket.tab.loaded = True
    html = socket.tab.evaljs('document.documentElement.outerHTML')
    res = {
        '_command': 'metadata',
        'loaded': socket.tab.loaded
    }
    if socket.tab.loaded:
        res.update(
            url=socket.tab.url,
            fp=hashlib.sha1(socket.tab.url).hexdigest(),
            response={
                'headers': {},  # TODO: Get headers
                'status': socket.tab.last_http_status()
            }
        )
        if socket.spiderspec:
            res.update(extract(socket))
    res.update(extra)
    return res

def extract(socket):
    """Run spider on page URL to get extracted links and items"""
    def _get_template_name(template_id, templates):
        for template in templates:
            if template['page_id'] == template_id:
                return template['name']
    items, links = [], []
    templates = socket.spiderspec.templates
    url = socket.tab.url
    html = socket.tab.evaljs('document.documentElement.outerHTML')
    for value in socket.spider.parse(page(url, html)):
        if isinstance(value, Request):
            links.append(value.url)
        elif isinstance(value, DictItem):
            value['_template_name'] = _get_template_name(value['_template'],
                                                         templates)
            items.append(value._values)
        else:
            raise ValueError("Unexpected type %s from spider" %
                             type(value))
    return {
        'items': items,
        'links': links
    }


def resize(data, socket):
    """Resize virtual tab viewport to match user's viewport"""
    try:
        if 'size' in data and _VIEWPORT_RE.search(data['size']):
            socket.tab.set_viewport(data['size'])
    except (KeyError, AttributeError):
        pass  # Tab isn't open. The size will be set when opened


def close_tab(data, socket):
    """Close virtual tab if it is open"""
    if socket.tab is not None:
        socket.tab.close()
        socket.factory[socket].tab = None

