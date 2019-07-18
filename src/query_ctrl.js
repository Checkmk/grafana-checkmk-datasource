import {QueryCtrl} from 'app/plugins/sdk';
import './css/query-editor.css!';

// TODO: move to utils
const isValidRegex = (regexString) => {
    try {
        new RegExp(regexString);
        return true;
    } catch(e) {
        return false;
    }
};

export class GenericDatasourceQueryCtrl extends QueryCtrl {

    constructor($scope, $injector)  {
        super($scope, $injector);

        this.scope = $scope;

        this.target.site = this.target.site || '';
        this.target.host = this.target.host || '';
        this.target.hostregex = this.target.hostregex || '';
        this.target.service = this.target.service || '';
        this.target.serviceregex = this.target.serviceregex || '';
        this.target.mode = this.target.mode || 'graph';
        this.target.metric = this.target.metric != null ? this.target.metric : '';
        this.target.graph = this.target.graph != null ? this.target.graph : '';
        this.target.presentation = this.target.presentation != null ? this.target.presentation : '';
        this.target.combinedgraph = this.target.combinedgraph != null ? this.target.combinedgraph : '';

        this.target.filter0group = this.target.filter0group || '';
        this.target.filter1group = this.target.filter1group || '';
        this.target.filter2group = this.target.filter2group || '';

        this.target.filter0op = this.target.filter0op || 'is';
        this.target.filter1op = this.target.filter1op || 'is';
        this.target.filter2op = this.target.filter2op || 'is';

        this.target.filter0value = this.target.filter0value || '';
        this.target.filter1value = this.target.filter1value || '';
        this.target.filter2value = this.target.filter2value || '';
    }

    getSiteOptions() {
        return this.datasource.sitesQuery(this.target);
    }

    getHostOptions() {
        return this.datasource.hostsQuery(this.target);
    }

    getServiceOptions() {
        return this.datasource.servicesQuery(this.target);
    }

    getMetricOptions() {
        return this.datasource.metricsQuery(this.target);
    }

    getGraphOptions() {
        return this.datasource.graphsQuery(this.target);
    }

    getCombinedGraphOptions() {
        return this.datasource.combinedGraphsQuery(this.target);
    }

    getFilterGroupOptions() {
        return this.datasource.filterGroupQuery(this.target);
    }

    getFilterOperationOptions() {
        return [
            {value: 'is',    text: 'is'},
            {value: 'isnot', text: 'is not'}
        ];
    }

    getFilterValueOptions(index) {
        return this.datasource.filterValueQuery(this.target, index);
    }

    getPresentationOptions() {
        return [
            {value: 'lines',   text: 'Lines'},
            {value: 'stacked', text: 'Stacked'},
            {value: 'sum',     text: 'Sum'},
            {value: 'average', text: 'Average'},
            {value: 'min',     text: 'Minimum'},
            {value: 'max',     text: 'Maximum'}
        ];
    }

    getModeOptions() {
        return [
            {text: 'predefined graph', value: 'graph'},
            {text: 'single metric', value: 'metric'},
            {text: 'combined graph', value: 'combined'}
        ];
    }

    getLastError() {
        return this.datasource.getLastError(this.target.refId);
    }

    toggleEditorMode() {
        this.target.rawQuery = !this.target.rawQuery;
    }

    isHostRegexValid() {
        return isValidRegex(this.target.hostregex);
    }

    isServiceRegexValid() {
        return isValidRegex(this.target.serviceregex);
    }

    resetGraph() {
        this.target.metric = '';
        this.target.graph = '';
        this.target.combinedgraph = '';
        this.target.presentation = '';

        return this;
    }

    resetFilter(index) {
        while(index < 2) {
            // move filters down by one
            this.target[`filter${index}group`] = this.target[`filter${index + 1}group`];
            this.target[`filter${index}op`] = this.target[`filter${index + 1}op`];
            this.target[`filter${index}value`] = this.target[`filter${index + 1}value`];
            index++;
        }
        this.target.filter2group = '';
        this.target.filter2op = 'is';
        this.target.filter2value = '';

        return this;
    }

    resetFilters() {
        this.resetFilter(0)
            .resetFilter(1)
            .resetFilter(2);

        return this;
    }

    resetService() {
        this.target.service = '';
        return this.resetGraph();
    }

    resetHost() {
        this.target.host = '';
        return this.resetService();
    }

    onSiteChange() {
        this.resetHost()
            .update();
    }

    onHostChange() {
        this.resetService()
            .update();
    }

    onHostRegexChange() {
        this.resetService()
            .update();
    }

    onServiceChange() {
        this.resetGraph()
            .update();
    }

    onServiceRegexChange() {
        this.resetGraph()
            .update();
    }

    onMetricChange() {
        this.update();
    }

    onFilterGroupChange(index) {
        this.target[`filter${index}op`] = 'is';
        this.target[`filter${index}value`] = '';
        this.update();
    }

    onFilterChange() {
        this.update();
    }

    onPresentationChange() {
        this.update();
    }

    onGraphChange() {
        this.update();
    }

    onCombinedGraphChange() {
        this.update();
    }

    onModeChange() {
        this.target.usehostregex = false;
        this.resetHost()
            .resetGraph()
            .resetFilters()
            .update();
    }

    update() {
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }
}

GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
