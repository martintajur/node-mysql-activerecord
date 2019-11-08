/**
 * List of Error of query execution
 *
 */

module.exports = {
    NO_TBL_NAME_ERR: new Error("Table name not specified"),
    NO_WHERE_CLAUSE_ERR: new Error("Where clause is not defined"),
    NO_CONN_OBJ_ERR: new Error("No connection object supplied to the Query Exec Library!"),
    FIRST_PARAM_OF_GET_WHERE_ERR: new Error("First parameter of get_where() must be a string or an array of strings."),
    SECOND_PARAM_OF_GET_WHERE_ERR: new Error("Second parameter of get_where() must be an object with key:value pairs."),
    NO_VALID_RESULTS_HANDLER: new Error('QueryBuilder is unsure how to respond since no callback or Promise resolve/reject methods were provided.'),
}
