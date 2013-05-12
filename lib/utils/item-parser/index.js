var atom    = require('./atom')
  , plain   = require('./plain')

var parsers = [
    atom,
    plain
]

exports.parse = function(item) {
   var entity = {}
   parsers.forEach(function(parser) {
       parser.parse(item, entity)
   })
   
   return entity
}

exports.build = function(data) {

    // Place payload as key 'payload' so we can 
    // pass by reference not value more easily
    var p = {}

    parsers.forEach(function(parser) {
        parser.build(data, p)
    })
    return p.payload
}
