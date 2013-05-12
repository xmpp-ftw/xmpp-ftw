var atom = require('./atom')

var parsers = [
    atom.parse
]

exports.parse = function(item) {
   var entity = {}
   parsers.forEach(function(parser) {
       parser(item, entity)
   })
   return entity
}
