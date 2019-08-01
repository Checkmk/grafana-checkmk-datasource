import {CheckmkDatasource} from './datasource';
import {CheckmkDatasourceQueryCtrl} from './query_ctrl';
import {CheckmkAnnotationsQueryCtrl} from './annotations_ctrl';

class CheckmkConfigCtrl {}
CheckmkConfigCtrl.templateUrl = 'partials/config.html';

class CheckmkQueryOptionsCtrl {}
CheckmkQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

export {
    CheckmkDatasource as Datasource,
    CheckmkDatasourceQueryCtrl as QueryCtrl,
    CheckmkConfigCtrl as ConfigCtrl,
    CheckmkQueryOptionsCtrl as QueryOptionsCtrl,
    CheckmkAnnotationsQueryCtrl as AnnotationsQueryCtrl
};
