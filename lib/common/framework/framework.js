'use strict';

var define = define ? define : require('amdefine')(module);

define(function(require) {
    /**
     * Module dependencies.
     */
    var utils = module.isClient
            ? require('-/danf/lib/common/utils')
            : require('../utils'),
        objectsContainer = {
            has: function(id) {
                return undefined !== this.objects[id] ? true : false;
            },
            get: function(id) {
                if (!this.has(id)) {
                    throw new Error('The object "{0}" is not defined.'.format(id))
                }

                return this.objects[id];
            },
            set: function(id, object) {
                this.objects[id] = object;
            }
        }
    ;

    objectsContainer.objects = {};

    /**
     * Initialize a new framework.
     */
    function Framework() {
        this._initializers = [];
        this._objects = {};
        this.objectsContainer = objectsContainer;
    }

    /**
     * The object container.
     */
    Object.defineProperty(Framework.prototype, 'objectsContainer', {
        get: function() { return this._objectsContainer; },
        set: function(objectsContainer) { this._objectsContainer = objectsContainer; }
    });

    /**
     * Add an initializer.
     *
     * @param {object} initializer The initializer.
     * @api public
     */
    Framework.prototype.addInitializer = function(initializer) {
        this._initializers.push(initializer);
    }

    /**
     * Whether or not an object has been instanciated.
     *
     * @param {String} id The id of the object.
     * @api public
     */
    Framework.prototype.has = function(id) {
        return this._objectsContainer.has(id);
    }

    /**
     * Get an object.
     *
     * @param {String} id The id of the service.
     * @return {Object} The service object.
     * @api public
     */
    Framework.prototype.get = function(id) {
        return this._objectsContainer.get(id);
    }

    /**
     * Set an object.
     *
     * @param {String} id The id of the object.
     * @param {Object} service The object.
     * @api public
     */
    Framework.prototype.set = function(id, object) {
        this._objectsContainer.set(id, object);
    }

    /**
     * Build the framework.
     *
     * @param {object} configuration The application danf configuration.
     * @param {object} context The application context.
     * @api public
     */
    Framework.prototype.build = function(configuration, context) {
        var parameters = {context: context};

        // Instantiate objects.
        for (var i = 0; i < this._initializers.length; i++) {
            var initializer = this._initializers[i];

            if (initializer.instantiate) {
                initializer.instantiate(this);
            }
        }

        // Inject dependencies between objects.
        for (var i = 0; i < this._initializers.length; i++) {
            var initializer = this._initializers[i];

            if (initializer.inject) {
                initializer.inject(this, parameters);
            }
        }

        // Process.
        var modules = {
                'ajax-app': 'ajaxApp',
                'assets': 'assets',
                'configuration': 'configuration',
                'dependency-injection': 'dependencyInjection',
                'event': 'event',
                'file-system': 'fileSystem',
                'http': 'http',
                'manipulation': 'manipulation',
                'object': 'object',
                'rendering': 'rendering',
                'vendor': 'vendor'
            },
            danf = {
                parameters: {},
            }
        ;

        if (!module.isClient) {
            danf['assets'] = {
                'require.js': __dirname + '/../../../node_modules/requirejs/require.js',
                'app.js': __dirname + '/../../client/app.js',
                'favicon.ico': __dirname + '/../../../resource/public/img/favicon.png',
                '-/danf': __dirname + '/../../client/danf.js',
                '-/danf/config/common': __dirname + '/../../../config/common',
                '-/danf/config/client': __dirname + '/../../../config/client',
                '-/danf/lib/common': __dirname + '/..',
                '-/danf/lib/client': __dirname + '/../../client',
                '-/danf/resource': __dirname + '/../../../resource/public'
            };
        }

        for (var path in modules) {
            var name = modules[path],
                modulePrefix = 'danf:{0}'.format(name),
                pathPrefixes = module.isClient
                    ? ['-/danf/config/common/{0}'.format(path), '-/danf/config/client/{0}'.format(path)]
                    : ['../../../config/common/{0}'.format(path), '../../../config/server/{0}'.format(path)],
                moduleConfig = {
                    'parameters': {},
                    'interfaces': {},
                    'services': {},
                    'classes': {}
                },
                hasServerConfig = false,
                handleError = function(error, modulePath) {
                    if (
                        (
                            -1 === error.message.indexOf('Cannot find module')
                            && -1 === error.message.indexOf('has not been loaded')
                        )
                        || -1 === error.message.indexOf(modulePath)
                    ) {
                        throw error;
                    }
                }
            ;

            for (var i = 0; i < pathPrefixes.length; i++) {
                var pathPrefix = pathPrefixes[i],
                    isServer = -1 !== pathPrefix.indexOf('/server') && !module.isClient
                ;

                // Handle parameters.
                try {
                    var modulePath = '{0}/{1}'.format(pathPrefix, 'parameters'),
                        parameters = require(modulePath)
                    ;

                    if (moduleConfig['parameters'][modulePrefix]) {
                        parameters = utils.merge(parameters, moduleConfig['parameters'][modulePrefix], true);
                    }
                    moduleConfig['parameters'][modulePrefix] = parameters;

                    hasServerConfig = isServer;
                } catch (error) {
                    handleError(error, modulePath);
                }

                // Handle interfaces.
                try {
                    var interfaces = {},
                        modulePath = '{0}/{1}'.format(pathPrefix, 'interfaces')
                    ;

                    interfaces[modulePrefix] = require('{0}/{1}'.format(pathPrefix, 'interfaces'));
                    interfaces = utils.flatten(interfaces, 1);
                    moduleConfig['interfaces'] = utils.merge(interfaces, moduleConfig['interfaces'], true);

                    hasServerConfig = isServer;
                } catch (error) {
                    handleError(error, modulePath);
                }

                // Handle classes.
                try {
                    var classes = {},
                        modulePath = '{0}/{1}'.format(pathPrefix, 'classes')
                    ;

                    classes[modulePrefix] = require(modulePath);
                    classes = utils.flatten(classes);
                    moduleConfig['classes'] = utils.merge(classes, moduleConfig['classes'], true);

                    hasServerConfig = isServer;
                } catch (error) {
                    handleError(error, modulePath);
                }

                // Handle services.
                try {
                    var services = {},
                        modulePath = '{0}/{1}'.format(pathPrefix, 'services')
                    ;

                    services[modulePrefix] = require('{0}/{1}'.format(pathPrefix, 'services'));
                    services = utils.flatten(services, 1);
                    moduleConfig['services'] = utils.merge(services, moduleConfig['services'], true);

                    hasServerConfig = isServer;
                } catch (error) {
                    handleError(error, modulePath);
                }

                // Handle sequences.
                try {
                    var sequences = {},
                        modulePath = '{0}/{1}'.format(pathPrefix, 'sequences')
                    ;

                    sequences[modulePrefix] = require('{0}/{1}'.format(pathPrefix, 'sequences'));
                    sequences = utils.flatten(sequences, 1);
                    moduleConfig['sequences'] = utils.merge(sequences, moduleConfig['sequences'], true);

                    hasServerConfig = isServer;
                } catch (error) {
                    handleError(error, modulePath);
                }

                // Handle events.
                try {
                    var modulePath = '{0}/{1}'.format(pathPrefix, 'events');

                    moduleConfig['events'] = utils.merge(
                        require(modulePath),
                        moduleConfig['events']
                    );

                    hasServerConfig = isServer;
                } catch (error) {
                    handleError(error, modulePath);
                }

                // Handle assets.
                try {
                    var modulePath = '{0}/{1}'.format(pathPrefix, 'assets');

                    moduleConfig['assets'] = utils.merge(
                        require(modulePath),
                        moduleConfig['assets']
                    );

                    hasServerConfig = isServer;
                } catch (error) {
                    handleError(error, modulePath);
                }
            }

            danf = utils.merge(danf, moduleConfig, true);
        }

        var parametersProcessor = this.get('danf:configuration.sectionProcessor.parameters');

        danf = parametersProcessor.preProcess(danf, utils.merge(danf.parameters, {'danf:context': context}));
        danf.classes = utils.flatten(danf.classes);

        for (var i = 0; i < this._initializers.length; i++) {
            var initializer = this._initializers[i];

            if (initializer.process) {
                initializer.process(this, parameters, danf, configuration);
            }
        }
    }

    /**
     * Expose `Framework`.
     */
    return Framework;
});