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
        service: query.service,
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
        return this.datasource.servicesQuery(this.config);
    }

    onSiteChange() {
        this.config.host = '';
        this.config.service = '';
        this.update();
    }

    onHostChange() {
        this.config.service = '';
        this.update();
    }

    onServiceChange() {
        this.update();
    }

    onShowAnnotationChange() {
        this.update();
    }

    update() {
        this.annotation.queries = [{
            site: this.config.site,
            host: this.config.host,
            service: this.config.service,
            showAnnotations: showAnnotationsOptions.filter((annotationType) => this.config.show[annotationType])
        }];
    }
}

CheckmkAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';