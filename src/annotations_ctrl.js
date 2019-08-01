export class GenericAnnotationsQueryCtrl {
    constructor(/*timeSrv, dashboardSrv*/) {
        this.target = this.target || {};
        this.target.site = this.target.site || '';
        this.target.host = this.target.host || '';
        this.target.service = this.target.service || '';

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

    update() {
        this.annotation.queries = [{
            site: this.target.site,
            host: this.target.host,
            service: this.target.service
        }];
    }
}

GenericAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';