'use strict';

require('../../../../lib/common/init');

var assert = require('assert'),
    danf = require('../../../../lib/server/app'),
    ReferenceType = require('../../../../lib/common/manipulation/reference-type'),
    ReferenceResolver = require('../../../../lib/common/manipulation/reference-resolver'),
    Json = require('../../../../lib/server/rendering/format-renderer/json')
;

var app = danf(require(__dirname + '/../../../fixture/rendering/danf'), '', {listen: false, environment: 'test'}),
    referenceType = new ReferenceType(),
    referenceResolver = new ReferenceResolver(),
    json = new Json(),
    response = app.response
;

referenceType.name = '@';
referenceType.delimiter = '@';
referenceResolver.addReferenceType(referenceType);
json.referenceResolver = referenceResolver;
response.req = app.request;

response.req = app.request;

var config = {
        value: {
            topic: '@topic@',
            messages: '@messages@'
        }
    },
    expected = {
        topic: 'foo',
        messages: ['foo', 'bar']
    },
    context = {
        foo: 'bar',
        topic: expected.topic,
        messages: expected.messages
    }
;

describe('Json', function() {
    it('method "render" should call the passed callback method after the content computing', function(done) {
        json.render(response, context, config, function(content) {
            assert.equal(
                content,
                JSON.stringify(expected)
            );

            done();
        });
    })
})