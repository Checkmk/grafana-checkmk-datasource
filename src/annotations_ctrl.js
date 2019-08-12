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

export class CheckmkAnnotationsQueryCtrl {
    constructor(/*timeSrv, dashboardSrv*/) {
        this.target = this.target || {};
        this.target.site = this.target.site || '';
        this.target.host = this.target.host || '';
        this.target.service = this.target.service || '';

        this.target.show = showAnnotationsOptions.reduce((all, option) => {
            all[option] = all[option] != null ? all[option] : true;
            return all;
        }, this.target.show || {});

        this.annotation.queries = this.annotation.queries || [];
    }

    getLastError() {
        return null;
    }

    getSiteOptions() {
        return this.datasource.sitesQuery(this.target, true);
    }

    getHostOptions() {
        return this.datasource.hostsQuery(this.target);
    }

    getServiceOptions() {
        return this.datasource.servicesQuery(this.target);
    }

    onSiteChange() {
        this.target.host = '';
        this.target.service = '';
        this.update();
    }

    onHostChange() {
        this.target.service = '';
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
            site: this.target.site,
            host: this.target.host,
            service: this.target.service,
            showAnnotations: showAnnotationsOptions.filter((annotationType) => this.target.show[annotationType])
        }];
    }
}

CheckmkAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';