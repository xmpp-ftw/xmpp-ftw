/* @flow */
'use strict'

module.exports = {
  Xmpp: require('./lib/xmpp'),
  Base: require('./lib/base'),
  Presence: require('./lib/presence'),
  Chat: require('./lib/chat'),
  Roster: require('./lib/roster'),
  JID: require('node-xmpp-client').JID,
  utils: {
    'xep-0004': require('./lib/utils/xep-0004'),
    'xep-0059': require('./lib/utils/xep-0059'),
    'xep-0066': require('./lib/utils/xep-0066'),
    'xep-0071': require('./lib/utils/xep-0071'),
    'xep-0085': require('./lib/utils/xep-0085'),
    'xep-0184': require('./lib/utils/xep-0184'),
    'xep-0203': require('./lib/utils/xep-0203'),
    'xep-0308': require('./lib/utils/xep-0308'),
    'xep-0280': require('./lib/utils/xep-0280'),
    'xep-0297': require('./lib/utils/xep-0297')
  }
}
