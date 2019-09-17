const showAnnotationsOptions = [
    'ok',
    'warn',
    'crit',
    'unknown',
    'flapping',
    'host_down',
    'in_downtime',
    'outof_notification_period',
    'outof_service_period',
    'unmonitored'
];

const queryToConfig = (query) => {
    if(!query) {
        return {};
    }

    const show = showAnnotationsOptions.reduce((all, option) => {
        all[option] = query.showAnnotations.includes(option);
        return all;
    }, {});

    return {
        site: query.site,
        host: query.host,
        hostregex: query.hostregex,
        usehostregex: query.usehostregex,
        service: query.service,
        serviceregex: query.serviceregex,
        useserviceregex: query.usehostregex || query.useserviceregex,
        show
    };
};

export class CheckmkAnnotationsQueryCtrl {
    constructor(/*timeSrv, dashboardSrv*/) {
        this.annotation.queries = this.annotation.queries || [];
        this.config = queryToConfig(this.annotation.queries[0]);
    }

    getLastError() {
        return null;
    }

    getSiteOptions() {
        return this.datasource.sitesQuery(this.config, true);
    }

    getHostOptions() {
        return this.datasource.hostsQuery(this.config);
    }

    getServiceOptions() {
        return this.datasource.servicesQuery(this.config, false);
    }

    onSiteChange() {
        this.config.host = '';
        this.config.hostregex = '';
        this.config.usehostregex = false;
        this.config.service = '';
        this.config.serviceregex = '';
        this.config.useserviceregex = false;
        this.update();
    }

    onHostChange() {
        this.config.service = '';
        this.config.hostregex = '';
        this.update();
    }

    onHostRegexChange() {
        this.config.service = '';
        this.config.host = '';
        this.update();
    }

    onServiceChange() {
        this.config.serviceregex = '';
        this.update();
    }

    onServiceRegexChange() {
        this.config.service = '';
        this.update();
    }

    onShowAnnotationChange() {
        this.update();
    }

    update() {
        this.annotation.queries = [{
            site: this.config.site,
            host: this.config.host,
            hostregex: this.config.hostregex,
            usehostregex: this.config.usehostregex,
            service: this.config.service,
            serviceregex: this.config.serviceregex,
            useserviceregex: this.config.usehostregex || this.config.useserviceregex,
            showAnnotations: showAnnotationsOptions.filter((annotationType) => this.config.show[annotationType])
        }];
    }
}

CheckmkAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';