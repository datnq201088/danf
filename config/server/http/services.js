'use strict';

module.exports = {
    errorHandler: {
        class: 'danf:http.errorHandler',
        properties: {
            debug: '%danf:context.debug%'
        }
    },
    cookiesRegistry: {
        class: 'danf:http.cookiesRegistry',
        properties: {
            flowContext: '#danf:sequencing.flowContext#'
        }
    },
    sessionHandler: {
        class: 'danf:http.sessionHandler',
        properties: {
            flowContext: '#danf:sequencing.flowContext#'
        }
    },
    redirector: {
        class: 'danf:http.redirector'
    },
    event: {
        children: {
            notifier: {
                parent: 'danf:event.notifier',
                children: {
                    request: {
                        class: 'danf:http.event.notifier.request',
                        properties: {
                            app: '#danf:app#',
                            escaper: '#danf:manipulation.escaper#',
                            renderer: '#danf:rendering.renderer#',
                            errorHandler: '#danf:http.errorHandler#',
                            logger: '#danf:logging.logger#'
                        }
                    }
                }
            }
        }
    }
};