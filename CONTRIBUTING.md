# Contributing guide

## Thank you

Firstly, thanks for thinking about contributing to this project and __xmpp-ftw__ in general!

Here's some guidelines that will help you get your pull requests merged more quickly/easily.

__Note:__ If there's a feature you'd like, there's a bug you'd like to fix, or you'd just like to get involved please raise an issue and start a conversation. We'll help as much as we can so you can get contributing - although we may not always get back right away :)

## What can I do?

* Bug fixes
 * Please see the issues list
* New features
 * New features are great. If we can be of any help before you make a PR please let us know
* New XEPs
 * Thinking of implementing a new XEP? Please let us know so we can help
* Documentation
 * Documentation is awesome! If you can help please do so
 * Includes translations
* Examples / tutorials
 * If you'v written examples or a tutorial please let us know and we'll add it to our code

## Coding standards

Most of the coding standards are covered by `.jshintrc`. You can also test 
any changes with `grunt test` (this will also run the tests).

Things not covered by jshint:

* Unless required __no semicolons__ they are not required
* Short one-line `if` statements do not require nipple brackets (provided functionality is clear)
* Multiple conditionals within an `if` statement should be surrounded by brackets
* `exports`/`module.exports` should be at the end of the file
* Longer, descriptive variable names are preferred, e.g. `error` vs `err`

Otherwise, if in doubt, follow the style of existing code.

## Tests

All code (unless very trivial, or documentation) should be accompanied by tests. If you are unsure about testing please make a pull request and we'll try and help you get some tests in place for your code.

Tests are run using `npm test` and should all pass before you make a pull request.

If you pull request relates to an issue, please name your test after the issue number (e.g. 'issue #58') so we can track it if there is a regression.
