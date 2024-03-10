/* adding a column for request repeat count in request table*/
alter table requests add requestRepeat int null

/* adding a column for request repeat count in draft_request table*/
alter table draft_requests add requestRepeat int null