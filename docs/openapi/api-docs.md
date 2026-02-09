---
title: OptimCE CRM Backend API Documentation v0.1.0
language_tabs:
  - NodeJS: Typescript
language_clients:
  - NodeJS: ""
toc_footers: []
includes: []
search: false
highlight_theme: darkula
headingLevel: 2

---

<!-- Generator: Widdershins v4.0.1 -->

<h1 id="optimce-crm-backend-api-documentation">OptimCE CRM Backend API Documentation v0.1.0</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

API documentation for the OptimCE CRM access

Base URLs:

* <a href="http://localhost:3000">http://localhost:3000</a>

# Authentication

<h1 id="optimce-crm-backend-api-documentation-default">Default</h1>

## Patch the role of a user

> Code samples

`PATCH /communities/`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id_user": {
      "type": "number"
    },
    "new_role": {
      "type": "string",
      "enum": [
        "MEMBER",
        "MANAGER",
        "ADMIN"
      ]
    }
  },
  "required": [
    "id_user",
    "new_role"
  ],
  "additionalProperties": false
}
```

<h3 id="patch-the-role-of-a-user-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[PatchRoleUserDTO](#schemapatchroleuserdto)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="patch-the-role-of-a-user-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|User role in community successfully patched|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="patch-the-role-of-a-user-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Leave a community

> Code samples

`DELETE /communities/leave/{id_community}`

<h3 id="leave-a-community-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id_community|path|integer|true|ID of the community|

> Example responses

> 200 Response

```json
null
```

<h3 id="leave-a-community-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successfully left the community|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="leave-a-community-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & MinRoleChecker
</aside>

## Kick a user from a community

> Code samples

`DELETE /communities/kick/{id_user}`

<h3 id="kick-a-user-from-a-community-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id_user|path|integer|true|ID of the user|

> Example responses

> 200 Response

```json
null
```

<h3 id="kick-a-user-from-a-community-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|User successfully kicked from the community|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="kick-a-user-from-a-community-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Delete an entire community

> Code samples

`DELETE /communities/delete/{id_community}`

<h3 id="delete-an-entire-community-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id_community|path|integer|true|ID of the community|

> Example responses

> 200 Response

```json
null
```

<h3 id="delete-an-entire-community-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Community successfully deleted|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="delete-an-entire-community-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Cancel a manager own invitation

> Code samples

`DELETE /invitations/{id_invitation}/own/manager`

<h3 id="cancel-a-manager-own-invitation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id_invitation|path|undefined|true|none|

<h3 id="cancel-a-manager-own-invitation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="success">
This operation does not require authentication
</aside>

## Delete a link between member and user

> Code samples

`DELETE /members/{id_member}/link`

<h3 id="delete-a-link-between-member-and-user-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id_member|path|integer|true|ID of the member|

> Example responses

> 200 Response

```json
null
```

<h3 id="delete-a-link-between-member-and-user-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Member link successfully deleted|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="delete-a-link-between-member-and-user-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

<h1 id="optimce-crm-backend-api-documentation-communities">Communities</h1>

Operation related to managing Communities CRUD operations

## Get my communities

> Code samples

`GET /communities/my-communities`

<h3 id="get-my-communities-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|filters|query|[CommunityQueryDTO](#schemacommunityquerydto)|false|Pagination and sort options for my communities|

> Example responses

> 200 Response

```json
null
```

<h3 id="get-my-communities-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful list of my communities|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-my-communities-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

## Get users of a community

> Code samples

`GET /communities/users`

<h3 id="get-users-of-a-community-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|filters|query|[CommunityUsersQueryDTO](#schemacommunityusersquerydto)|false|Pagination and filter options for community users|

> Example responses

> 200 Response

```json
null
```

<h3 id="get-users-of-a-community-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful list of community users|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|

<h3 id="get-users-of-a-community-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Get admins of a community

> Code samples

`GET /communities/admins`

<h3 id="get-admins-of-a-community-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|filters|query|[CommunityUsersQueryDTO](#schemacommunityusersquerydto)|false|Pagination and filter options for community users|

> Example responses

> 200 Response

```json
null
```

<h3 id="get-admins-of-a-community-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful list of community admins & managers|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-admins-of-a-community-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker
</aside>

## Create a new community

> Code samples

`POST /communities/`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    }
  },
  "required": [
    "name"
  ],
  "additionalProperties": false
}
```

<h3 id="create-a-new-community-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CreateCommunityDTO](#schemacreatecommunitydto)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="create-a-new-community-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Community successfully created|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="create-a-new-community-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

## Update a community

> Code samples

`PUT /communities/`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    }
  },
  "required": [
    "name"
  ],
  "additionalProperties": false
}
```

<h3 id="update-a-community-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CreateCommunityDTO](#schemacreatecommunitydto)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="update-a-community-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Community successfully updated|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="update-a-community-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

<h1 id="optimce-crm-backend-api-documentation-documents">Documents</h1>

Operation related to managing Documents CRUD operations and interaction with the external storage service

## Get all documents linked to a member

> Code samples

`GET /documents/{member_id}`

<h3 id="get-all-documents-linked-to-a-member-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id_member|path|integer|true|ID of the member|
|filters|query|[DocumentQueryDTO](#schemadocumentquerydto)|false|Pagination, filter and sort options for documents|

> Example responses

> 200 Response

```json
null
```

<h3 id="get-all-documents-linked-to-a-member-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful list of documents|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-all-documents-linked-to-a-member-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Download a specific document

> Code samples

`GET /documents/{member_id}/{document_id}`

<h3 id="download-a-specific-document-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id_member|path|integer|true|ID of the member|
|document_id|path|integer|true|ID of the document|

> Example responses

> 200 Response

> 400 Response

```json
{
  "success": false,
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="download-a-specific-document-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful document download|string|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="download-a-specific-document-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Upload a document

> Code samples

`POST /documents/`

> Body parameter

```yaml
file: string
id_member: 0

```

<h3 id="upload-a-document-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|true|none|
|» file|body|string(binary)|true|none|
|» id_member|body|integer|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="upload-a-document-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Document successfully uploaded|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="upload-a-document-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Delete a specific document

> Code samples

`DELETE /documents/{document_id}`

<h3 id="delete-a-specific-document-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|document_id|path|integer|true|ID of the document|

> Example responses

> 200 Response

```json
null
```

<h3 id="delete-a-specific-document-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Document successfully deleted|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="delete-a-specific-document-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

<h1 id="optimce-crm-backend-api-documentation-invitations">Invitations</h1>

Operation related to managing invitation of new user in the community

## Get all member pending invitations

> Code samples

`GET /invitations/`

<h3 id="get-all-member-pending-invitations-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|filters|query|[UserMemberInvitationQuery](#schemausermemberinvitationquery)|false|Pagination and filter options for member invitations|

> Example responses

> 200 Response

```json
null
```

<h3 id="get-all-member-pending-invitations-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful list of member invitations|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-all-member-pending-invitations-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Get all managers pending invitations

> Code samples

`GET /invitations/managers`

<h3 id="get-all-managers-pending-invitations-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|filters|query|[UserManagerInvitationQuery](#schemausermanagerinvitationquery)|false|Pagination and filter options for manager invitations|

> Example responses

> 200 Response

```json
null
```

<h3 id="get-all-managers-pending-invitations-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful list of manager invitations|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-all-managers-pending-invitations-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Get all own member pending invitations

> Code samples

`GET /invitations/own`

<h3 id="get-all-own-member-pending-invitations-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|filters|query|[UserMemberInvitationQuery](#schemausermemberinvitationquery)|false|Pagination and filter options for member invitations|

> Example responses

> 200 Response

```json
null
```

<h3 id="get-all-own-member-pending-invitations-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful list of member invitations|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-all-own-member-pending-invitations-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

## Get all own managers pending invitations

> Code samples

`GET /invitations/own/managers`

<h3 id="get-all-own-managers-pending-invitations-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|filters|query|[UserManagerInvitationQuery](#schemausermanagerinvitationquery)|false|Pagination and filter options for manager invitations|

> Example responses

> 200 Response

```json
null
```

<h3 id="get-all-own-managers-pending-invitations-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful list of manager invitations|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-all-own-managers-pending-invitations-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

## Invite a user to become a member

> Code samples

`POST /invitations/member`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "user_email": {
      "type": "string"
    }
  },
  "required": [
    "user_email"
  ],
  "additionalProperties": false
}
```

<h3 id="invite-a-user-to-become-a-member-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[InviteUser](#schemainviteuser)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="invite-a-user-to-become-a-member-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Operation successful|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="invite-a-user-to-become-a-member-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Invite a user to become a manager

> Code samples

`POST /invitations/manager`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "user_email": {
      "type": "string"
    }
  },
  "required": [
    "user_email"
  ],
  "additionalProperties": false
}
```

<h3 id="invite-a-user-to-become-a-manager-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[InviteUser](#schemainviteuser)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="invite-a-user-to-become-a-manager-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Operation successful|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="invite-a-user-to-become-a-manager-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Accept an invitation member

> Code samples

`POST /invitations/accept`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "invitation_id": {
      "type": "number"
    }
  },
  "required": [
    "invitation_id"
  ],
  "additionalProperties": false
}
```

<h3 id="accept-an-invitation-member-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[AcceptInvitationDTO](#schemaacceptinvitationdto)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="accept-an-invitation-member-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Operation successful|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="accept-an-invitation-member-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

## Accept an invitation with encoded member

> Code samples

`POST /invitations/accept/encoded`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "invitation_id": {
      "type": "number"
    },
    "member": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "member_type": {
          "type": "number",
          "enum": [
            1,
            2
          ]
        },
        "status": {
          "type": "number",
          "enum": [
            1,
            2,
            3
          ]
        },
        "iban": {
          "type": "string"
        },
        "home_address": {
          "type": "object",
          "properties": {
            "street": {
              "type": "string"
            },
            "number": {
              "type": "number"
            },
            "city": {
              "type": "string"
            },
            "postcode": {
              "type": "string"
            },
            "supplement": {
              "type": "string"
            }
          },
          "required": [
            "street",
            "number",
            "city",
            "postcode"
          ],
          "additionalProperties": false
        },
        "billing_address": {
          "type": "object",
          "properties": {
            "street": {
              "type": "string"
            },
            "number": {
              "type": "number"
            },
            "city": {
              "type": "string"
            },
            "postcode": {
              "type": "string"
            },
            "supplement": {
              "type": "string"
            }
          },
          "required": [
            "street",
            "number",
            "city",
            "postcode"
          ],
          "additionalProperties": false
        },
        "first_name": {
          "type": "string"
        },
        "NRN": {
          "type": "string"
        },
        "email": {
          "type": "string"
        },
        "phone_number": {
          "type": "string"
        },
        "social_rate": {
          "type": "boolean"
        },
        "vat_number": {
          "type": "string"
        },
        "manager_id": {
          "type": "number"
        }
      },
      "required": [
        "name",
        "member_type",
        "status",
        "iban",
        "home_address",
        "billing_address",
        "first_name",
        "NRN",
        "email",
        "social_rate",
        "vat_number"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "invitation_id",
    "member"
  ],
  "additionalProperties": false
}
```

<h3 id="accept-an-invitation-with-encoded-member-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[AcceptInvitationWEncodedDTO](#schemaacceptinvitationwencodeddto)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="accept-an-invitation-with-encoded-member-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Operation successful|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="accept-an-invitation-with-encoded-member-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

## Accept an invitation for manager

> Code samples

`POST /invitations/accept/manager`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "invitation_id": {
      "type": "number"
    }
  },
  "required": [
    "invitation_id"
  ],
  "additionalProperties": false
}
```

<h3 id="accept-an-invitation-for-manager-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[AcceptInvitationDTO](#schemaacceptinvitationdto)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="accept-an-invitation-for-manager-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Operation successful|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="accept-an-invitation-for-manager-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

## Cancel a member invitation

> Code samples

`DELETE /invitations/{id_invitation}/member`

<h3 id="cancel-a-member-invitation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id_invitation|path|integer|true|ID of the invitation|

> Example responses

> 200 Response

```json
null
```

<h3 id="cancel-a-member-invitation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Operation successful|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="cancel-a-member-invitation-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Cancel a manager invitation

> Code samples

`DELETE /invitations/{id_invitation}/manager`

<h3 id="cancel-a-manager-invitation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id_invitation|path|integer|true|ID of the invitation|

> Example responses

> 200 Response

```json
null
```

<h3 id="cancel-a-manager-invitation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Operation successful|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="cancel-a-manager-invitation-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Cancel a member own invitation

> Code samples

`DELETE /invitations/{id_invitation}/own/member`

<h3 id="cancel-a-member-own-invitation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id_invitation|path|integer|true|ID of the invitation|

> Example responses

> 200 Response

```json
null
```

<h3 id="cancel-a-member-own-invitation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Operation successful|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="cancel-a-member-own-invitation-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

<h1 id="optimce-crm-backend-api-documentation-keys">Keys</h1>

Operation related to managing allocation key of communities

## Get partial list of keys

> Code samples

`GET /keys/`

<h3 id="get-partial-list-of-keys-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|filters|query|[KeyPartialQuery](#schemakeypartialquery)|false|Pagination and filter options for keys|

> Example responses

> 200 Response

```json
null
```

<h3 id="get-partial-list-of-keys-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful list of keys|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-partial-list-of-keys-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Add a key

> Code samples

`POST /keys/`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "iterations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "number": {
            "type": "number"
          },
          "energy_allocated_percentage": {
            "type": "number"
          },
          "consumers": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "energy_allocated_percentage": {
                  "type": "number"
                }
              },
              "required": [
                "name",
                "energy_allocated_percentage"
              ],
              "additionalProperties": false
            }
          }
        },
        "required": [
          "number",
          "energy_allocated_percentage",
          "consumers"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "name",
    "description",
    "iterations"
  ],
  "additionalProperties": false
}
```

<h3 id="add-a-key-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CreateKeyDTO](#schemacreatekeydto)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="add-a-key-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Key successfully created|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="add-a-key-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Update a key

> Code samples

`PUT /keys/`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "iterations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "number": {
            "type": "number"
          },
          "energy_allocated_percentage": {
            "type": "number"
          },
          "consumers": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "energy_allocated_percentage": {
                  "type": "number"
                }
              },
              "required": [
                "name",
                "energy_allocated_percentage"
              ],
              "additionalProperties": false
            }
          }
        },
        "required": [
          "number",
          "energy_allocated_percentage",
          "consumers"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "id",
    "name",
    "description",
    "iterations"
  ],
  "additionalProperties": false
}
```

<h3 id="update-a-key-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[UpdateKeyDTO](#schemaupdatekeydto)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="update-a-key-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Key successfully updated|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="update-a-key-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Get a detailed key

> Code samples

`GET /keys/{id}`

<h3 id="get-a-detailed-key-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|integer|true|ID of the key|

> Example responses

> 200 Response

```json
null
```

<h3 id="get-a-detailed-key-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful key retrieval|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-a-detailed-key-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Delete a key

> Code samples

`DELETE /keys/{id}`

<h3 id="delete-a-key-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|integer|true|ID of the key|

> Example responses

> 200 Response

```json
null
```

<h3 id="delete-a-key-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Key successfully deleted|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="delete-a-key-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Get download a detailled key

> Code samples

`GET /keys/{id}/download`

<h3 id="get-download-a-detailled-key-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|integer|true|ID of the key|

> Example responses

> 200 Response

```json
null
```

<h3 id="get-download-a-detailled-key-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful key download retrieval|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-download-a-detailled-key-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

<h1 id="optimce-crm-backend-api-documentation-members">Members</h1>

Operations related to managing CRM members (individuals and companies)

## Retrieve a paginated list of members

> Code samples

`GET /members/`

Retrieve members with optional filters defined in MemberPartialQuery.

<h3 id="retrieve-a-paginated-list-of-members-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|filters|query|[MemberPartialQuery](#schemamemberpartialquery)|false|Pagination and Filter options|

> Example responses

> 200 Response

```json
null
```

<h3 id="retrieve-a-paginated-list-of-members-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful list of members|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="retrieve-a-paginated-list-of-members-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Create a new member

> Code samples

`POST /members/`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "member_type": {
      "type": "number",
      "enum": [
        1,
        2
      ]
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    },
    "iban": {
      "type": "string"
    },
    "home_address": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "city": {
          "type": "string"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        }
      },
      "required": [
        "street",
        "number",
        "city",
        "postcode"
      ],
      "additionalProperties": false
    },
    "billing_address": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "city": {
          "type": "string"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        }
      },
      "required": [
        "street",
        "number",
        "city",
        "postcode"
      ],
      "additionalProperties": false
    },
    "first_name": {
      "type": "string"
    },
    "NRN": {
      "type": "string"
    },
    "email": {
      "type": "string"
    },
    "phone_number": {
      "type": "string"
    },
    "social_rate": {
      "type": "boolean"
    },
    "vat_number": {
      "type": "string"
    },
    "manager_id": {
      "type": "number"
    }
  },
  "required": [
    "name",
    "member_type",
    "status",
    "iban",
    "home_address",
    "billing_address",
    "first_name",
    "NRN",
    "email",
    "social_rate",
    "vat_number"
  ],
  "additionalProperties": false
}
```

<h3 id="create-a-new-member-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CreateMemberDTO](#schemacreatememberdto)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="create-a-new-member-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Member successfully created|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="create-a-new-member-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Update a member

> Code samples

`PUT /members/`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "name": {
      "type": "string"
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    },
    "iban": {
      "type": "string"
    },
    "home_address": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "city": {
          "type": "string"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "billing_address": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "city": {
          "type": "string"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "first_name": {
      "type": "string"
    },
    "NRN": {
      "type": "string"
    },
    "email": {
      "type": "string"
    },
    "phone_number": {
      "type": "string"
    },
    "social_rate": {
      "type": "boolean"
    },
    "vat_number": {
      "type": "string"
    },
    "manager_id": {
      "type": "number"
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false
}
```

<h3 id="update-a-member-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[UpdateMemberDTO](#schemaupdatememberdto)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="update-a-member-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Member successfully updated|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="update-a-member-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Retrieve a specific member

> Code samples

`GET /members/{id_member}`

<h3 id="retrieve-a-specific-member-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id_member|path|integer|true|ID of the member|

> Example responses

> 200 Response

```json
null
```

<h3 id="retrieve-a-specific-member-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful member details|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="retrieve-a-specific-member-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Delete a member

> Code samples

`DELETE /members/{id_member}`

<h3 id="delete-a-member-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id_member|path|integer|true|ID of the member|

> Example responses

> 200 Response

```json
null
```

<h3 id="delete-a-member-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Member successfully deleted|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="delete-a-member-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Retrieve the member link status

> Code samples

`GET /members/{id_member}/link`

<h3 id="retrieve-the-member-link-status-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id_member|path|integer|true|ID of the member|

> Example responses

> 200 Response

```json
null
```

<h3 id="retrieve-the-member-link-status-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful member link status|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="retrieve-the-member-link-status-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Update a member status

> Code samples

`PATCH /members/status`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id_member": {
      "type": "number"
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    }
  },
  "required": [
    "id_member",
    "status"
  ],
  "additionalProperties": false
}
```

<h3 id="update-a-member-status-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[PatchMemberStatusDTO](#schemapatchmemberstatusdto)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="update-a-member-status-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Member status successfully patched|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="update-a-member-status-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Invite an user to create a link with this member

> Code samples

`PATCH /members/invite`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id_member": {
      "type": "number"
    },
    "user_email": {
      "type": "string"
    }
  },
  "required": [
    "id_member",
    "user_email"
  ],
  "additionalProperties": false
}
```

<h3 id="invite-an-user-to-create-a-link-with-this-member-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[PatchMemberInviteUserDTO](#schemapatchmemberinviteuserdto)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="invite-an-user-to-create-a-link-with-this-member-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Member invite user successfully done|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="invite-an-user-to-create-a-link-with-this-member-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

<h1 id="optimce-crm-backend-api-documentation-meters">Meters</h1>

Physical meter management and reading history

## Get a partial list of meters

> Code samples

`GET /meters/`

<h3 id="get-a-partial-list-of-meters-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|filters|query|[MeterPartialQuery](#schemameterpartialquery)|false|Pagination and filter options for meters|

> Example responses

> 200 Response

```json
null
```

<h3 id="get-a-partial-list-of-meters-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful list of meters|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-a-partial-list-of-meters-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Add a new meter

> Code samples

`POST /meters/`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "EAN": {
      "type": "string"
    },
    "meter_number": {
      "type": "string"
    },
    "address": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "city": {
          "type": "string"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        }
      },
      "required": [
        "street",
        "number",
        "city",
        "postcode"
      ],
      "additionalProperties": false
    },
    "tarif_group": {
      "type": "number",
      "enum": [
        1,
        2
      ]
    },
    "phases_number": {
      "type": "number"
    },
    "reading_frequency": {
      "type": "number",
      "enum": [
        1,
        2
      ]
    },
    "initial_data": {
      "type": "object",
      "properties": {
        "start_date": {
          "type": "string",
          "format": "date-time"
        },
        "end_date": {
          "type": "string",
          "format": "date-time"
        },
        "status": {
          "type": "number",
          "enum": [
            1,
            2,
            3,
            4
          ]
        },
        "rate": {
          "type": "number",
          "enum": [
            1,
            2,
            3
          ]
        },
        "client_type": {
          "type": "number",
          "enum": [
            1,
            2,
            3
          ]
        },
        "description": {
          "type": "string"
        },
        "sampling_power": {
          "type": "number"
        },
        "amperage": {
          "type": "number"
        },
        "grd": {
          "type": "string"
        },
        "injection_status": {
          "type": "number",
          "enum": [
            1,
            2,
            3,
            4
          ]
        },
        "production_chain": {
          "type": "number",
          "enum": [
            1,
            2,
            3,
            4,
            5,
            6,
            7
          ]
        },
        "total_generating_capacity": {
          "type": "number"
        },
        "member_id": {
          "type": "number"
        },
        "sharing_operation_id": {
          "type": "number"
        }
      },
      "required": [
        "start_date",
        "status",
        "rate",
        "client_type"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "EAN",
    "meter_number",
    "address",
    "tarif_group",
    "phases_number",
    "reading_frequency",
    "initial_data"
  ],
  "additionalProperties": false
}
```

<h3 id="add-a-new-meter-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CreateMeterDTO](#schemacreatemeterdto)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="add-a-new-meter-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Meter successfully added|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="add-a-new-meter-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Get a detailed meter

> Code samples

`GET /meters/{id}`

<h3 id="get-a-detailed-meter-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|ID (EAN or Meter Number) of the meter|

> Example responses

> 200 Response

```json
null
```

<h3 id="get-a-detailed-meter-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful meter retrieval|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-a-detailed-meter-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Delete a meter

> Code samples

`DELETE /meters/{id}`

<h3 id="delete-a-meter-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|ID (EAN or Meter Number) of the meter|

> Example responses

> 200 Response

```json
null
```

<h3 id="delete-a-meter-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Meter successfully deleted|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="delete-a-meter-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Get the consumption of a meter

> Code samples

`GET /meters/{id}/consumptions`

<h3 id="get-the-consumption-of-a-meter-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|ID (EAN or Meter Number) of the meter|
|filters|query|[MeterConsumptionQuery](#schemameterconsumptionquery)|false|Date range filters for meter consumptions|

> Example responses

> 200 Response

```json
null
```

<h3 id="get-the-consumption-of-a-meter-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful meter consumptions retrieval|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-the-consumption-of-a-meter-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Download the consumption of a meter

> Code samples

`GET /meters/{id}/consumptions/download`

<h3 id="download-the-consumption-of-a-meter-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|ID (EAN or Meter Number) of the meter|
|filters|query|[MeterConsumptionQuery](#schemameterconsumptionquery)|false|Date range filters for meter consumptions|

> Example responses

> 200 Response

> 400 Response

```json
{
  "success": false,
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="download-the-consumption-of-a-meter-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful meter consumptions download|string|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="download-the-consumption-of-a-meter-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Patch meter data

> Code samples

`PATCH /meters/data`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "start_date": {
      "type": "string",
      "format": "date-time"
    },
    "end_date": {
      "type": "string",
      "format": "date-time"
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3,
        4
      ]
    },
    "rate": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    },
    "client_type": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    },
    "description": {
      "type": "string"
    },
    "sampling_power": {
      "type": "number"
    },
    "amperage": {
      "type": "number"
    },
    "grd": {
      "type": "string"
    },
    "injection_status": {
      "type": "number",
      "enum": [
        1,
        2,
        3,
        4
      ]
    },
    "production_chain": {
      "type": "number",
      "enum": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "total_generating_capacity": {
      "type": "number"
    },
    "member_id": {
      "type": "number"
    },
    "sharing_operation_id": {
      "type": "number"
    },
    "EAN": {
      "type": "string"
    }
  },
  "required": [
    "EAN",
    "client_type",
    "rate",
    "start_date",
    "status"
  ],
  "additionalProperties": false
}
```

<h3 id="patch-meter-data-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[PatchMeterDataDTO](#schemapatchmeterdatadto)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="patch-meter-data-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Meter data successfully patched|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="patch-meter-data-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

<h1 id="optimce-crm-backend-api-documentation-sharingoperations">SharingOperations</h1>

Operation related to managing Sharing Operation living within the community

## Get partial list of sharing operations

> Code samples

`GET /sharing_operations/`

<h3 id="get-partial-list-of-sharing-operations-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|filters|query|[SharingOperationPartialQuery](#schemasharingoperationpartialquery)|false|Pagination and filter options for sharing operations|

> Example responses

> 200 Response

```json
null
```

<h3 id="get-partial-list-of-sharing-operations-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful list of sharing operations|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-partial-list-of-sharing-operations-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Create a new sharing operation

> Code samples

`POST /sharing_operations/`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "type": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    }
  },
  "required": [
    "name",
    "type"
  ],
  "additionalProperties": false
}
```

<h3 id="create-a-new-sharing-operation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CreateSharingOperationDTO](#schemacreatesharingoperationdto)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="create-a-new-sharing-operation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Sharing operation successfully created|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="create-a-new-sharing-operation-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Get a detailed sharing operations

> Code samples

`GET /sharing_operations/{id}`

<h3 id="get-a-detailed-sharing-operations-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|integer|true|ID of the sharing operation|

> Example responses

> 200 Response

```json
null
```

<h3 id="get-a-detailed-sharing-operations-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful sharing operation retrieval|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-a-detailed-sharing-operations-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Delete a sharing operation

> Code samples

`DELETE /sharing_operations/{id}`

<h3 id="delete-a-sharing-operation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|integer|true|ID of the sharing operation|

> Example responses

> 200 Response

```json
null
```

<h3 id="delete-a-sharing-operation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Sharing operation successfully deleted|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="delete-a-sharing-operation-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Get consumptions information about a sharing operation

> Code samples

`GET /sharing_operations/{id}/consumptions`

<h3 id="get-consumptions-information-about-a-sharing-operation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|integer|true|ID of the sharing operation|
|filters|query|[SharingOperationConsumptionQuery](#schemasharingoperationconsumptionquery)|false|Date range filters for sharing operation consumptions|

> Example responses

> 200 Response

```json
null
```

<h3 id="get-consumptions-information-about-a-sharing-operation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful sharing operation consumptions retrieval|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-consumptions-information-about-a-sharing-operation-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Download consumptions information about a sharing operation

> Code samples

`GET /sharing_operations/{id}/consumptions/download`

<h3 id="download-consumptions-information-about-a-sharing-operation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|integer|true|ID of the sharing operation|
|filters|query|[SharingOperationConsumptionQuery](#schemasharingoperationconsumptionquery)|false|Date range filters for sharing operation consumptions|

> Example responses

> 200 Response

> 400 Response

```json
{
  "success": false,
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="download-consumptions-information-about-a-sharing-operation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful sharing operation consumptions download|string|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="download-consumptions-information-about-a-sharing-operation-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Add a new key to the sharing operation

> Code samples

`POST /sharing_operations/key`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id_key": {
      "type": "number"
    },
    "id_sharing": {
      "type": "number"
    }
  },
  "required": [
    "id_key",
    "id_sharing"
  ],
  "additionalProperties": false
}
```

<h3 id="add-a-new-key-to-the-sharing-operation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[AddKeyToSharingOperationDTO](#schemaaddkeytosharingoperationdto)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="add-a-new-key-to-the-sharing-operation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Key successfully added to waiting list|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="add-a-new-key-to-the-sharing-operation-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Change the status of a key in the sharing operation

> Code samples

`PATCH /sharing_operations/key`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id_key": {
      "type": "number"
    },
    "id_sharing": {
      "type": "number"
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    },
    "date": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "id_key",
    "id_sharing",
    "status",
    "date"
  ],
  "additionalProperties": false
}
```

<h3 id="change-the-status-of-a-key-in-the-sharing-operation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[PatchKeyToSharingOperationDTO](#schemapatchkeytosharingoperationdto)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="change-the-status-of-a-key-in-the-sharing-operation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Key status successfully patched|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="change-the-status-of-a-key-in-the-sharing-operation-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Add a new meter to the sharing operation

> Code samples

`POST /sharing_operations/meter`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id_sharing": {
      "type": "number"
    },
    "date": {
      "type": "string",
      "format": "date-time"
    },
    "ean_list": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "id_sharing",
    "date",
    "ean_list"
  ],
  "additionalProperties": false
}
```

<h3 id="add-a-new-meter-to-the-sharing-operation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[AddMeterToSharingOperationDTO](#schemaaddmetertosharingoperationdto)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="add-a-new-meter-to-the-sharing-operation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Meter successfully added to waiting list|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="add-a-new-meter-to-the-sharing-operation-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Change the status of a meter in the sharing operation

> Code samples

`PATCH /sharing_operations/meter`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id_meter": {
      "type": "string"
    },
    "id_sharing": {
      "type": "number"
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3,
        4
      ]
    },
    "date": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "id_meter",
    "id_sharing",
    "status",
    "date"
  ],
  "additionalProperties": false
}
```

<h3 id="change-the-status-of-a-meter-in-the-sharing-operation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[PatchMeterToSharingOperationDTO](#schemapatchmetertosharingoperationdto)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="change-the-status-of-a-meter-in-the-sharing-operation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Meter status successfully patched|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="change-the-status-of-a-meter-in-the-sharing-operation-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Upload external consumptions data

> Code samples

`POST /sharing_operations/consumptions`

> Body parameter

```yaml
file: string
id_sharing_operation: 0

```

<h3 id="upload-external-consumptions-data-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|true|none|
|» file|body|string(binary)|true|Consumption file (CSV, Excel). Max size 5MB.|
|» id_sharing_operation|body|integer|true|ID of the sharing operation|

> Example responses

> 200 Response

```json
null
```

<h3 id="upload-external-consumptions-data-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Consumptions successfully added|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="upload-external-consumptions-data-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Delete a meter from a sharing operation

> Code samples

`DELETE /sharing_operations/{id}/meter`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id_meter": {
      "type": "string"
    },
    "id_sharing": {
      "type": "number"
    },
    "date": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "id_meter",
    "id_sharing",
    "date"
  ],
  "additionalProperties": false
}
```

<h3 id="delete-a-meter-from-a-sharing-operation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|undefined|true|none|
|body|body|[RemoveMeterFromSharingOperationDTO](#schemaremovemeterfromsharingoperationdto)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="delete-a-meter-from-a-sharing-operation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Meter successfully removed from sharing operation|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="delete-a-meter-from-a-sharing-operation-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

<h1 id="optimce-crm-backend-api-documentation-users">Users</h1>

Operation related to managing users of the application

## Get the user profile

> Code samples

`GET /users/`

> Example responses

> 200 Response

```json
null
```

<h3 id="get-the-user-profile-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful user profile retrieval|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|

<h3 id="get-the-user-profile-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

## Update the user profile

> Code samples

`PUT /users/`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "first_name": {
      "type": "string"
    },
    "last_name": {
      "type": "string"
    },
    "nrn": {
      "type": "string"
    },
    "phone_number": {
      "type": "string"
    },
    "iban": {
      "type": "string"
    },
    "home_address": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "city": {
          "type": "string"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        }
      },
      "required": [
        "street",
        "number",
        "city",
        "postcode"
      ],
      "additionalProperties": false
    },
    "billing_address": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "city": {
          "type": "string"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        }
      },
      "required": [
        "street",
        "number",
        "city",
        "postcode"
      ],
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```

<h3 id="update-the-user-profile-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[UpdateUserDTO](#schemaupdateuserdto)|true|none|

> Example responses

> 200 Response

```json
null
```

<h3 id="update-the-user-profile-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|User profile successfully updated|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|

<h3 id="update-the-user-profile-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» success|boolean|false|none|none|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

# Schemas

<h2 id="tocS_Pagination">Pagination</h2>
<!-- backwards compatibility -->
<a id="schemapagination"></a>
<a id="schema_Pagination"></a>
<a id="tocSpagination"></a>
<a id="tocspagination"></a>

```json
{
  "description": "Pagination informations for partial responses",
  "content": {
    "application/json": {
      "schema": {
        "page": {
          "type": "number",
          "minimum": 1,
          "example": 1
        },
        "limit": {
          "type": "number",
          "example": 10
        },
        "total": {
          "type": "number",
          "example": 40
        },
        "total_pages": {
          "type": "number",
          "example": 4
        }
      }
    }
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|description|string|false|none|none|
|content|object|false|none|none|
|» application|object|false|none|none|
|»» schema|object|false|none|none|
|»»» page|object|false|none|none|
|»»»» type|string|false|none|none|
|»»»» minimum|number|false|none|none|
|»»»» example|number|false|none|none|
|»»» limit|object|false|none|none|
|»»»» type|string|false|none|none|
|»»»» example|number|false|none|none|
|»»» total|object|false|none|none|
|»»»» type|string|false|none|none|
|»»»» example|number|false|none|none|
|»»» total_pages|object|false|none|none|
|»»»» type|string|false|none|none|
|»»»» example|number|false|none|none|

<h2 id="tocS_UploadedDocument">UploadedDocument</h2>
<!-- backwards compatibility -->
<a id="schemauploadeddocument"></a>
<a id="schema_UploadedDocument"></a>
<a id="tocSuploadeddocument"></a>
<a id="tocsuploadeddocument"></a>

```json
{
  "type": "object",
  "properties": {
    "url": {
      "type": "string"
    },
    "file_type": {
      "type": "string"
    }
  },
  "required": [
    "url",
    "file_type"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» url|object|false|none|none|
|»» type|string|false|none|none|
|» file_type|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_Sort">Sort</h2>
<!-- backwards compatibility -->
<a id="schemasort"></a>
<a id="schema_Sort"></a>
<a id="tocSsort"></a>
<a id="tocssort"></a>

```json
{
  "type": "string",
  "enum": [
    "ASC",
    "DESC"
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|enum|[string]|false|none|none|

<h2 id="tocS_PaginationQuery">PaginationQuery</h2>
<!-- backwards compatibility -->
<a id="schemapaginationquery"></a>
<a id="schema_PaginationQuery"></a>
<a id="tocSpaginationquery"></a>
<a id="tocspaginationquery"></a>

```json
{
  "type": "object",
  "properties": {
    "page": {
      "type": "number"
    },
    "limit": {
      "type": "number"
    }
  },
  "required": [
    "page",
    "limit"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» page|object|false|none|none|
|»» type|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_CreateAddressDTO">CreateAddressDTO</h2>
<!-- backwards compatibility -->
<a id="schemacreateaddressdto"></a>
<a id="schema_CreateAddressDTO"></a>
<a id="tocScreateaddressdto"></a>
<a id="tocscreateaddressdto"></a>

```json
{
  "type": "object",
  "properties": {
    "street": {
      "type": "string"
    },
    "number": {
      "type": "number"
    },
    "city": {
      "type": "string"
    },
    "postcode": {
      "type": "string"
    },
    "supplement": {
      "type": "string"
    }
  },
  "required": [
    "street",
    "number",
    "city",
    "postcode"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» street|object|false|none|none|
|»» type|string|false|none|none|
|» number|object|false|none|none|
|»» type|string|false|none|none|
|» city|object|false|none|none|
|»» type|string|false|none|none|
|» postcode|object|false|none|none|
|»» type|string|false|none|none|
|» supplement|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_UpdateAddressDTO">UpdateAddressDTO</h2>
<!-- backwards compatibility -->
<a id="schemaupdateaddressdto"></a>
<a id="schema_UpdateAddressDTO"></a>
<a id="tocSupdateaddressdto"></a>
<a id="tocsupdateaddressdto"></a>

```json
{
  "type": "object",
  "properties": {
    "street": {
      "type": "string"
    },
    "number": {
      "type": "number"
    },
    "city": {
      "type": "string"
    },
    "postcode": {
      "type": "string"
    },
    "supplement": {
      "type": "string"
    }
  },
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» street|object|false|none|none|
|»» type|string|false|none|none|
|» number|object|false|none|none|
|»» type|string|false|none|none|
|» city|object|false|none|none|
|»» type|string|false|none|none|
|» postcode|object|false|none|none|
|»» type|string|false|none|none|
|» supplement|object|false|none|none|
|»» type|string|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_AddressDTO">AddressDTO</h2>
<!-- backwards compatibility -->
<a id="schemaaddressdto"></a>
<a id="schema_AddressDTO"></a>
<a id="tocSaddressdto"></a>
<a id="tocsaddressdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "street": {
      "type": "string"
    },
    "number": {
      "type": "number"
    },
    "postcode": {
      "type": "string"
    },
    "supplement": {
      "type": "string"
    },
    "city": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "street",
    "number",
    "postcode",
    "city"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» street|object|false|none|none|
|»» type|string|false|none|none|
|» number|object|false|none|none|
|»» type|string|false|none|none|
|» postcode|object|false|none|none|
|»» type|string|false|none|none|
|» supplement|object|false|none|none|
|»» type|string|false|none|none|
|» city|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_UserDTO">UserDTO</h2>
<!-- backwards compatibility -->
<a id="schemauserdto"></a>
<a id="schema_UserDTO"></a>
<a id="tocSuserdto"></a>
<a id="tocsuserdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "first_name": {
      "type": [
        "string",
        "null"
      ]
    },
    "last_name": {
      "type": [
        "string",
        "null"
      ]
    },
    "nrn": {
      "type": [
        "string",
        "null"
      ]
    },
    "phone_number": {
      "type": [
        "string",
        "null"
      ]
    },
    "email": {
      "type": "string"
    },
    "iban": {
      "type": [
        "string",
        "null"
      ]
    },
    "home_address": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        },
        "city": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "street",
        "number",
        "postcode",
        "city"
      ],
      "additionalProperties": false
    },
    "billing_address": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        },
        "city": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "street",
        "number",
        "postcode",
        "city"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "id",
    "email"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» first_name|object|false|none|none|
|»» type|[string]|false|none|none|
|» last_name|object|false|none|none|
|»» type|[string]|false|none|none|
|» nrn|object|false|none|none|
|»» type|[string]|false|none|none|
|» phone_number|object|false|none|none|
|»» type|[string]|false|none|none|
|» email|object|false|none|none|
|»» type|string|false|none|none|
|» iban|object|false|none|none|
|»» type|[string]|false|none|none|
|» home_address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» billing_address|[AddressDTO](#schemaaddressdto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_UpdateUserDTO">UpdateUserDTO</h2>
<!-- backwards compatibility -->
<a id="schemaupdateuserdto"></a>
<a id="schema_UpdateUserDTO"></a>
<a id="tocSupdateuserdto"></a>
<a id="tocsupdateuserdto"></a>

```json
{
  "type": "object",
  "properties": {
    "first_name": {
      "type": "string"
    },
    "last_name": {
      "type": "string"
    },
    "nrn": {
      "type": "string"
    },
    "phone_number": {
      "type": "string"
    },
    "iban": {
      "type": "string"
    },
    "home_address": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "city": {
          "type": "string"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        }
      },
      "required": [
        "street",
        "number",
        "city",
        "postcode"
      ],
      "additionalProperties": false
    },
    "billing_address": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "city": {
          "type": "string"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        }
      },
      "required": [
        "street",
        "number",
        "city",
        "postcode"
      ],
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» first_name|object|false|none|none|
|»» type|string|false|none|none|
|» last_name|object|false|none|none|
|»» type|string|false|none|none|
|» nrn|object|false|none|none|
|»» type|string|false|none|none|
|» phone_number|object|false|none|none|
|»» type|string|false|none|none|
|» iban|object|false|none|none|
|»» type|string|false|none|none|
|» home_address|[CreateAddressDTO](#schemacreateaddressdto)|false|none|none|
|» billing_address|[CreateAddressDTO](#schemacreateaddressdto)|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_AreIterationsSumOneConstraint">AreIterationsSumOneConstraint</h2>
<!-- backwards compatibility -->
<a id="schemaareiterationssumoneconstraint"></a>
<a id="schema_AreIterationsSumOneConstraint"></a>
<a id="tocSareiterationssumoneconstraint"></a>
<a id="tocsareiterationssumoneconstraint"></a>

```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": {}
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|additionalProperties|boolean|false|none|none|
|properties|object|false|none|none|

<h2 id="tocS_ValidatorConstraintInterface">ValidatorConstraintInterface</h2>
<!-- backwards compatibility -->
<a id="schemavalidatorconstraintinterface"></a>
<a id="schema_ValidatorConstraintInterface"></a>
<a id="tocSvalidatorconstraintinterface"></a>
<a id="tocsvalidatorconstraintinterface"></a>

```json
{
  "type": "object",
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_AreConsumersSumOneConstraint">AreConsumersSumOneConstraint</h2>
<!-- backwards compatibility -->
<a id="schemaareconsumerssumoneconstraint"></a>
<a id="schema_AreConsumersSumOneConstraint"></a>
<a id="tocSareconsumerssumoneconstraint"></a>
<a id="tocsareconsumerssumoneconstraint"></a>

```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": {}
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|additionalProperties|boolean|false|none|none|
|properties|object|false|none|none|

<h2 id="tocS_KeyPartialQuery">KeyPartialQuery</h2>
<!-- backwards compatibility -->
<a id="schemakeypartialquery"></a>
<a id="schema_KeyPartialQuery"></a>
<a id="tocSkeypartialquery"></a>
<a id="tocskeypartialquery"></a>

```json
{
  "type": "object",
  "properties": {
    "page": {
      "type": "number"
    },
    "limit": {
      "type": "number"
    },
    "description": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "sort_name": {
      "type": "string",
      "enum": [
        "ASC",
        "DESC"
      ]
    }
  },
  "additionalProperties": false,
  "required": [
    "limit",
    "page"
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» page|object|false|none|none|
|»» type|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|» description|object|false|none|none|
|»» type|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» sort_name|[Sort](#schemasort)|false|none|none|
|additionalProperties|boolean|false|none|none|
|required|[string]|false|none|none|

<h2 id="tocS_KeyPartialDTO">KeyPartialDTO</h2>
<!-- backwards compatibility -->
<a id="schemakeypartialdto"></a>
<a id="schema_KeyPartialDTO"></a>
<a id="tocSkeypartialdto"></a>
<a id="tocskeypartialdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "name",
    "description"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» description|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_ConsumerDTO">ConsumerDTO</h2>
<!-- backwards compatibility -->
<a id="schemaconsumerdto"></a>
<a id="schema_ConsumerDTO"></a>
<a id="tocSconsumerdto"></a>
<a id="tocsconsumerdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "name": {
      "type": "string"
    },
    "energy_allocated_percentage": {
      "type": "number"
    }
  },
  "required": [
    "id",
    "name",
    "energy_allocated_percentage"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» energy_allocated_percentage|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_IterationDTO">IterationDTO</h2>
<!-- backwards compatibility -->
<a id="schemaiterationdto"></a>
<a id="schema_IterationDTO"></a>
<a id="tocSiterationdto"></a>
<a id="tocsiterationdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "number": {
      "type": "number"
    },
    "energy_allocated_percentage": {
      "type": "number"
    },
    "consumers": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "number"
          },
          "name": {
            "type": "string"
          },
          "energy_allocated_percentage": {
            "type": "number"
          }
        },
        "required": [
          "id",
          "name",
          "energy_allocated_percentage"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "id",
    "number",
    "energy_allocated_percentage",
    "consumers"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» number|object|false|none|none|
|»» type|string|false|none|none|
|» energy_allocated_percentage|object|false|none|none|
|»» type|string|false|none|none|
|» consumers|object|false|none|none|
|»» type|string|false|none|none|
|»» items|[ConsumerDTO](#schemaconsumerdto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_KeyDTO">KeyDTO</h2>
<!-- backwards compatibility -->
<a id="schemakeydto"></a>
<a id="schema_KeyDTO"></a>
<a id="tocSkeydto"></a>
<a id="tocskeydto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "iterations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "number"
          },
          "number": {
            "type": "number"
          },
          "energy_allocated_percentage": {
            "type": "number"
          },
          "consumers": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "number"
                },
                "name": {
                  "type": "string"
                },
                "energy_allocated_percentage": {
                  "type": "number"
                }
              },
              "required": [
                "id",
                "name",
                "energy_allocated_percentage"
              ],
              "additionalProperties": false
            }
          }
        },
        "required": [
          "id",
          "number",
          "energy_allocated_percentage",
          "consumers"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "description",
    "id",
    "iterations",
    "name"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» description|object|false|none|none|
|»» type|string|false|none|none|
|» iterations|object|false|none|none|
|»» type|string|false|none|none|
|»» items|[IterationDTO](#schemaiterationdto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_CreateConsumerDTO">CreateConsumerDTO</h2>
<!-- backwards compatibility -->
<a id="schemacreateconsumerdto"></a>
<a id="schema_CreateConsumerDTO"></a>
<a id="tocScreateconsumerdto"></a>
<a id="tocscreateconsumerdto"></a>

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "energy_allocated_percentage": {
      "type": "number"
    }
  },
  "required": [
    "name",
    "energy_allocated_percentage"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» energy_allocated_percentage|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_CreateIterationDTO">CreateIterationDTO</h2>
<!-- backwards compatibility -->
<a id="schemacreateiterationdto"></a>
<a id="schema_CreateIterationDTO"></a>
<a id="tocScreateiterationdto"></a>
<a id="tocscreateiterationdto"></a>

```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "number"
    },
    "energy_allocated_percentage": {
      "type": "number"
    },
    "consumers": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "energy_allocated_percentage": {
            "type": "number"
          }
        },
        "required": [
          "name",
          "energy_allocated_percentage"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "number",
    "energy_allocated_percentage",
    "consumers"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» number|object|false|none|none|
|»» type|string|false|none|none|
|» energy_allocated_percentage|object|false|none|none|
|»» type|string|false|none|none|
|» consumers|object|false|none|none|
|»» type|string|false|none|none|
|»» items|[CreateConsumerDTO](#schemacreateconsumerdto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_CreateKeyDTO">CreateKeyDTO</h2>
<!-- backwards compatibility -->
<a id="schemacreatekeydto"></a>
<a id="schema_CreateKeyDTO"></a>
<a id="tocScreatekeydto"></a>
<a id="tocscreatekeydto"></a>

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "iterations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "number": {
            "type": "number"
          },
          "energy_allocated_percentage": {
            "type": "number"
          },
          "consumers": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "energy_allocated_percentage": {
                  "type": "number"
                }
              },
              "required": [
                "name",
                "energy_allocated_percentage"
              ],
              "additionalProperties": false
            }
          }
        },
        "required": [
          "number",
          "energy_allocated_percentage",
          "consumers"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "name",
    "description",
    "iterations"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» description|object|false|none|none|
|»» type|string|false|none|none|
|» iterations|object|false|none|none|
|»» type|string|false|none|none|
|»» items|[CreateIterationDTO](#schemacreateiterationdto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_UpdateKeyDTO">UpdateKeyDTO</h2>
<!-- backwards compatibility -->
<a id="schemaupdatekeydto"></a>
<a id="schema_UpdateKeyDTO"></a>
<a id="tocSupdatekeydto"></a>
<a id="tocsupdatekeydto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "iterations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "number": {
            "type": "number"
          },
          "energy_allocated_percentage": {
            "type": "number"
          },
          "consumers": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "energy_allocated_percentage": {
                  "type": "number"
                }
              },
              "required": [
                "name",
                "energy_allocated_percentage"
              ],
              "additionalProperties": false
            }
          }
        },
        "required": [
          "number",
          "energy_allocated_percentage",
          "consumers"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "id",
    "name",
    "description",
    "iterations"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» description|object|false|none|none|
|»» type|string|false|none|none|
|» iterations|object|false|none|none|
|»» type|string|false|none|none|
|»» items|[CreateIterationDTO](#schemacreateiterationdto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_SharingOperationPartialQuery">SharingOperationPartialQuery</h2>
<!-- backwards compatibility -->
<a id="schemasharingoperationpartialquery"></a>
<a id="schema_SharingOperationPartialQuery"></a>
<a id="tocSsharingoperationpartialquery"></a>
<a id="tocssharingoperationpartialquery"></a>

```json
{
  "type": "object",
  "properties": {
    "page": {
      "type": "number"
    },
    "limit": {
      "type": "number"
    },
    "name": {
      "type": "string"
    },
    "type": {
      "type": "string"
    },
    "sort_name": {
      "type": "string",
      "enum": [
        "ASC",
        "DESC"
      ]
    },
    "sort_type": {
      "type": "string",
      "enum": [
        "ASC",
        "DESC"
      ]
    }
  },
  "additionalProperties": false,
  "required": [
    "limit",
    "page"
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» page|object|false|none|none|
|»» type|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» type|object|false|none|none|
|»» type|string|false|none|none|
|» sort_name|[Sort](#schemasort)|false|none|none|
|» sort_type|[Sort](#schemasort)|false|none|none|
|additionalProperties|boolean|false|none|none|
|required|[string]|false|none|none|

<h2 id="tocS_SharingOperationConsumptionQuery">SharingOperationConsumptionQuery</h2>
<!-- backwards compatibility -->
<a id="schemasharingoperationconsumptionquery"></a>
<a id="schema_SharingOperationConsumptionQuery"></a>
<a id="tocSsharingoperationconsumptionquery"></a>
<a id="tocssharingoperationconsumptionquery"></a>

```json
{
  "type": "object",
  "properties": {
    "date_start": {
      "type": "string",
      "format": "date-time"
    },
    "date_end": {
      "type": "string",
      "format": "date-time"
    }
  },
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» date_start|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|» date_end|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_SharingOperationPartialDTO">SharingOperationPartialDTO</h2>
<!-- backwards compatibility -->
<a id="schemasharingoperationpartialdto"></a>
<a id="schema_SharingOperationPartialDTO"></a>
<a id="tocSsharingoperationpartialdto"></a>
<a id="tocssharingoperationpartialdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "name": {
      "type": "string"
    },
    "type": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    }
  },
  "required": [
    "id",
    "name",
    "type"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» type|[SharingOperationType](#schemasharingoperationtype)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_SharingOperationType">SharingOperationType</h2>
<!-- backwards compatibility -->
<a id="schemasharingoperationtype"></a>
<a id="schema_SharingOperationType"></a>
<a id="tocSsharingoperationtype"></a>
<a id="tocssharingoperationtype"></a>

```json
{
  "type": "number",
  "enum": [
    1,
    2,
    3
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|enum|[number]|false|none|none|

<h2 id="tocS_SharingOperationKeyDTO">SharingOperationKeyDTO</h2>
<!-- backwards compatibility -->
<a id="schemasharingoperationkeydto"></a>
<a id="schema_SharingOperationKeyDTO"></a>
<a id="tocSsharingoperationkeydto"></a>
<a id="tocssharingoperationkeydto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "key": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "name": {
          "type": "string"
        },
        "description": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "name",
        "description"
      ],
      "additionalProperties": false
    },
    "start_date": {
      "type": "string",
      "format": "date-time"
    },
    "end_date": {
      "type": "string",
      "format": "date-time"
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    }
  },
  "required": [
    "id",
    "key",
    "start_date",
    "end_date",
    "status"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» key|[KeyPartialDTO](#schemakeypartialdto)|false|none|none|
|» start_date|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|» end_date|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|» status|[SharingKeyStatus](#schemasharingkeystatus)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_SharingKeyStatus">SharingKeyStatus</h2>
<!-- backwards compatibility -->
<a id="schemasharingkeystatus"></a>
<a id="schema_SharingKeyStatus"></a>
<a id="tocSsharingkeystatus"></a>
<a id="tocssharingkeystatus"></a>

```json
{
  "type": "number",
  "enum": [
    1,
    2,
    3
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|enum|[number]|false|none|none|

<h2 id="tocS_SharingOperationDTO">SharingOperationDTO</h2>
<!-- backwards compatibility -->
<a id="schemasharingoperationdto"></a>
<a id="schema_SharingOperationDTO"></a>
<a id="tocSsharingoperationdto"></a>
<a id="tocssharingoperationdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "name": {
      "type": "string"
    },
    "type": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    },
    "key": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "key": {
          "type": "object",
          "properties": {
            "id": {
              "type": "number"
            },
            "name": {
              "type": "string"
            },
            "description": {
              "type": "string"
            }
          },
          "required": [
            "id",
            "name",
            "description"
          ],
          "additionalProperties": false
        },
        "start_date": {
          "type": "string",
          "format": "date-time"
        },
        "end_date": {
          "type": "string",
          "format": "date-time"
        },
        "status": {
          "type": "number",
          "enum": [
            1,
            2,
            3
          ]
        }
      },
      "required": [
        "id",
        "key",
        "start_date",
        "end_date",
        "status"
      ],
      "additionalProperties": false
    },
    "history_keys": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "number"
          },
          "key": {
            "type": "object",
            "properties": {
              "id": {
                "type": "number"
              },
              "name": {
                "type": "string"
              },
              "description": {
                "type": "string"
              }
            },
            "required": [
              "id",
              "name",
              "description"
            ],
            "additionalProperties": false
          },
          "start_date": {
            "type": "string",
            "format": "date-time"
          },
          "end_date": {
            "type": "string",
            "format": "date-time"
          },
          "status": {
            "type": "number",
            "enum": [
              1,
              2,
              3
            ]
          }
        },
        "required": [
          "id",
          "key",
          "start_date",
          "end_date",
          "status"
        ],
        "additionalProperties": false
      }
    },
    "key_waiting_approval": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "key": {
          "type": "object",
          "properties": {
            "id": {
              "type": "number"
            },
            "name": {
              "type": "string"
            },
            "description": {
              "type": "string"
            }
          },
          "required": [
            "id",
            "name",
            "description"
          ],
          "additionalProperties": false
        },
        "start_date": {
          "type": "string",
          "format": "date-time"
        },
        "end_date": {
          "type": "string",
          "format": "date-time"
        },
        "status": {
          "type": "number",
          "enum": [
            1,
            2,
            3
          ]
        }
      },
      "required": [
        "id",
        "key",
        "start_date",
        "end_date",
        "status"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "history_keys",
    "id",
    "key",
    "key_waiting_approval",
    "name",
    "type"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» type|[SharingOperationType](#schemasharingoperationtype)|false|none|none|
|» key|[SharingOperationKeyDTO](#schemasharingoperationkeydto)|false|none|none|
|» history_keys|object|false|none|none|
|»» type|string|false|none|none|
|»» items|[SharingOperationKeyDTO](#schemasharingoperationkeydto)|false|none|none|
|» key_waiting_approval|[SharingOperationKeyDTO](#schemasharingoperationkeydto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_SharingOpConsumptionDTO">SharingOpConsumptionDTO</h2>
<!-- backwards compatibility -->
<a id="schemasharingopconsumptiondto"></a>
<a id="schema_SharingOpConsumptionDTO"></a>
<a id="tocSsharingopconsumptiondto"></a>
<a id="tocssharingopconsumptiondto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "timestamps": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "gross": {
      "type": "array",
      "items": {
        "type": "number"
      }
    },
    "net": {
      "type": "array",
      "items": {
        "type": "number"
      }
    },
    "shared": {
      "type": "array",
      "items": {
        "type": "number"
      }
    },
    "inj_gross": {
      "type": "array",
      "items": {
        "type": "number"
      }
    },
    "inj_net": {
      "type": "array",
      "items": {
        "type": "number"
      }
    },
    "inj_shared": {
      "type": "array",
      "items": {
        "type": "number"
      }
    }
  },
  "required": [
    "id",
    "timestamps",
    "gross",
    "net",
    "shared",
    "inj_gross",
    "inj_net",
    "inj_shared"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» timestamps|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|» gross|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|» net|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|» shared|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|» inj_gross|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|» inj_net|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|» inj_shared|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_CreateSharingOperationDTO">CreateSharingOperationDTO</h2>
<!-- backwards compatibility -->
<a id="schemacreatesharingoperationdto"></a>
<a id="schema_CreateSharingOperationDTO"></a>
<a id="tocScreatesharingoperationdto"></a>
<a id="tocscreatesharingoperationdto"></a>

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "type": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    }
  },
  "required": [
    "name",
    "type"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» type|[SharingOperationType](#schemasharingoperationtype)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_AddKeyToSharingOperationDTO">AddKeyToSharingOperationDTO</h2>
<!-- backwards compatibility -->
<a id="schemaaddkeytosharingoperationdto"></a>
<a id="schema_AddKeyToSharingOperationDTO"></a>
<a id="tocSaddkeytosharingoperationdto"></a>
<a id="tocsaddkeytosharingoperationdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id_key": {
      "type": "number"
    },
    "id_sharing": {
      "type": "number"
    }
  },
  "required": [
    "id_key",
    "id_sharing"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id_key|object|false|none|none|
|»» type|string|false|none|none|
|» id_sharing|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_AddMeterToSharingOperationDTO">AddMeterToSharingOperationDTO</h2>
<!-- backwards compatibility -->
<a id="schemaaddmetertosharingoperationdto"></a>
<a id="schema_AddMeterToSharingOperationDTO"></a>
<a id="tocSaddmetertosharingoperationdto"></a>
<a id="tocsaddmetertosharingoperationdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id_sharing": {
      "type": "number"
    },
    "date": {
      "type": "string",
      "format": "date-time"
    },
    "ean_list": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "id_sharing",
    "date",
    "ean_list"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id_sharing|object|false|none|none|
|»» type|string|false|none|none|
|» date|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|» ean_list|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_AddConsumptionDataDTO">AddConsumptionDataDTO</h2>
<!-- backwards compatibility -->
<a id="schemaaddconsumptiondatadto"></a>
<a id="schema_AddConsumptionDataDTO"></a>
<a id="tocSaddconsumptiondatadto"></a>
<a id="tocsaddconsumptiondatadto"></a>

```json
{
  "type": "object",
  "properties": {
    "id_sharing_operation": {
      "type": "number"
    },
    "file": {
      "type": "object",
      "properties": {
        "fieldname": {
          "type": "string"
        },
        "originalname": {
          "type": "string"
        },
        "encoding": {
          "type": "string"
        },
        "mimetype": {
          "type": "string"
        },
        "size": {
          "type": "number"
        },
        "stream": {
          "type": "object",
          "properties": {
            "readable": {
              "type": "boolean"
            },
            "readableAborted": {
              "type": "boolean"
            },
            "readableDidRead": {
              "type": "boolean"
            },
            "readableEncoding": {
              "anyOf": [
                {
                  "type": "null"
                }
              ]
            },
            "readableEnded": {
              "type": "boolean"
            },
            "readableFlowing": {
              "type": [
                "boolean",
                "null"
              ]
            },
            "readableHighWaterMark": {
              "type": "number"
            },
            "readableLength": {
              "type": "number"
            },
            "readableObjectMode": {
              "type": "boolean"
            },
            "destroyed": {
              "type": "boolean"
            },
            "closed": {
              "type": "boolean"
            },
            "errored": {
              "anyOf": [
                {
                  "type": "null"
                }
              ]
            }
          },
          "required": [
            "closed",
            "destroyed",
            "errored",
            "readable",
            "readableAborted",
            "readableDidRead",
            "readableEncoding",
            "readableEnded",
            "readableFlowing",
            "readableHighWaterMark",
            "readableLength",
            "readableObjectMode"
          ],
          "additionalProperties": false
        },
        "destination": {
          "type": "string"
        },
        "filename": {
          "type": "string"
        },
        "path": {
          "type": "string"
        },
        "buffer": {
          "type": "object",
          "additionalProperties": {
            "type": "number"
          },
          "properties": {
            "BYTES_PER_ELEMENT": {
              "type": "number"
            },
            "buffer": {
              "type": "object",
              "properties": {
                "byteLength": {
                  "type": "number"
                }
              },
              "required": [
                "byteLength"
              ],
              "additionalProperties": false
            },
            "byteLength": {
              "type": "number"
            },
            "byteOffset": {
              "type": "number"
            },
            "length": {
              "type": "number"
            }
          },
          "required": [
            "BYTES_PER_ELEMENT",
            "buffer",
            "byteLength",
            "byteOffset",
            "length"
          ]
        }
      },
      "required": [
        "fieldname",
        "originalname",
        "encoding",
        "mimetype",
        "size",
        "stream",
        "destination",
        "filename",
        "path",
        "buffer"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "id_sharing_operation",
    "file"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id_sharing_operation|object|false|none|none|
|»» type|string|false|none|none|
|» file|[global.Express.Multer.File](#schemaglobal.express.multer.file)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_global.Express.Multer.File">global.Express.Multer.File</h2>
<!-- backwards compatibility -->
<a id="schemaglobal.express.multer.file"></a>
<a id="schema_global.Express.Multer.File"></a>
<a id="tocSglobal.express.multer.file"></a>
<a id="tocsglobal.express.multer.file"></a>

```json
{
  "type": "object",
  "properties": {
    "fieldname": {
      "type": "string"
    },
    "originalname": {
      "type": "string"
    },
    "encoding": {
      "type": "string"
    },
    "mimetype": {
      "type": "string"
    },
    "size": {
      "type": "number"
    },
    "stream": {
      "type": "object",
      "properties": {
        "readable": {
          "type": "boolean"
        },
        "readableAborted": {
          "type": "boolean"
        },
        "readableDidRead": {
          "type": "boolean"
        },
        "readableEncoding": {
          "anyOf": [
            {
              "type": "null"
            }
          ]
        },
        "readableEnded": {
          "type": "boolean"
        },
        "readableFlowing": {
          "type": [
            "boolean",
            "null"
          ]
        },
        "readableHighWaterMark": {
          "type": "number"
        },
        "readableLength": {
          "type": "number"
        },
        "readableObjectMode": {
          "type": "boolean"
        },
        "destroyed": {
          "type": "boolean"
        },
        "closed": {
          "type": "boolean"
        },
        "errored": {
          "anyOf": [
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "closed",
        "destroyed",
        "errored",
        "readable",
        "readableAborted",
        "readableDidRead",
        "readableEncoding",
        "readableEnded",
        "readableFlowing",
        "readableHighWaterMark",
        "readableLength",
        "readableObjectMode"
      ],
      "additionalProperties": false
    },
    "destination": {
      "type": "string"
    },
    "filename": {
      "type": "string"
    },
    "path": {
      "type": "string"
    },
    "buffer": {
      "type": "object",
      "additionalProperties": {
        "type": "number"
      },
      "properties": {
        "BYTES_PER_ELEMENT": {
          "type": "number"
        },
        "buffer": {
          "type": "object",
          "properties": {
            "byteLength": {
              "type": "number"
            }
          },
          "required": [
            "byteLength"
          ],
          "additionalProperties": false
        },
        "byteLength": {
          "type": "number"
        },
        "byteOffset": {
          "type": "number"
        },
        "length": {
          "type": "number"
        }
      },
      "required": [
        "BYTES_PER_ELEMENT",
        "buffer",
        "byteLength",
        "byteOffset",
        "length"
      ]
    }
  },
  "required": [
    "fieldname",
    "originalname",
    "encoding",
    "mimetype",
    "size",
    "stream",
    "destination",
    "filename",
    "path",
    "buffer"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» fieldname|object|false|none|none|
|»» type|string|false|none|none|
|» originalname|object|false|none|none|
|»» type|string|false|none|none|
|» encoding|object|false|none|none|
|»» type|string|false|none|none|
|» mimetype|object|false|none|none|
|»» type|string|false|none|none|
|» size|object|false|none|none|
|»» type|string|false|none|none|
|» stream|[Stream.Readable](#schemastream.readable)|false|none|none|
|» destination|object|false|none|none|
|»» type|string|false|none|none|
|» filename|object|false|none|none|
|»» type|string|false|none|none|
|» path|object|false|none|none|
|»» type|string|false|none|none|
|» buffer|[global.Buffer](#schemaglobal.buffer)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_Stream.Readable">Stream.Readable</h2>
<!-- backwards compatibility -->
<a id="schemastream.readable"></a>
<a id="schema_Stream.Readable"></a>
<a id="tocSstream.readable"></a>
<a id="tocsstream.readable"></a>

```json
{
  "type": "object",
  "properties": {
    "readable": {
      "type": "boolean"
    },
    "readableAborted": {
      "type": "boolean"
    },
    "readableDidRead": {
      "type": "boolean"
    },
    "readableEncoding": {
      "anyOf": [
        {
          "type": "null"
        }
      ]
    },
    "readableEnded": {
      "type": "boolean"
    },
    "readableFlowing": {
      "type": [
        "boolean",
        "null"
      ]
    },
    "readableHighWaterMark": {
      "type": "number"
    },
    "readableLength": {
      "type": "number"
    },
    "readableObjectMode": {
      "type": "boolean"
    },
    "destroyed": {
      "type": "boolean"
    },
    "closed": {
      "type": "boolean"
    },
    "errored": {
      "anyOf": [
        {
          "type": "null"
        }
      ]
    }
  },
  "required": [
    "closed",
    "destroyed",
    "errored",
    "readable",
    "readableAborted",
    "readableDidRead",
    "readableEncoding",
    "readableEnded",
    "readableFlowing",
    "readableHighWaterMark",
    "readableLength",
    "readableObjectMode"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» readable|object|false|none|none|
|»» type|string|false|none|none|
|» readableAborted|object|false|none|none|
|»» type|string|false|none|none|
|» readableDidRead|object|false|none|none|
|»» type|string|false|none|none|
|» readableEncoding|object|false|none|none|
|»» anyOf|[object]|false|none|none|
|»»» type|string|false|none|none|
|» readableEnded|object|false|none|none|
|»» type|string|false|none|none|
|» readableFlowing|object|false|none|none|
|»» type|[string]|false|none|none|
|» readableHighWaterMark|object|false|none|none|
|»» type|string|false|none|none|
|» readableLength|object|false|none|none|
|»» type|string|false|none|none|
|» readableObjectMode|object|false|none|none|
|»» type|string|false|none|none|
|» destroyed|object|false|none|none|
|»» type|string|false|none|none|
|» closed|object|false|none|none|
|»» type|string|false|none|none|
|» errored|object|false|none|none|
|»» anyOf|[object]|false|none|none|
|»»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_global.NodeJS.ReadableStream">global.NodeJS.ReadableStream</h2>
<!-- backwards compatibility -->
<a id="schemaglobal.nodejs.readablestream"></a>
<a id="schema_global.NodeJS.ReadableStream"></a>
<a id="tocSglobal.nodejs.readablestream"></a>
<a id="tocsglobal.nodejs.readablestream"></a>

```json
{
  "type": "object",
  "properties": {
    "readable": {
      "type": "boolean"
    }
  },
  "required": [
    "readable"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» readable|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_global.NodeJS.EventEmitter">global.NodeJS.EventEmitter</h2>
<!-- backwards compatibility -->
<a id="schemaglobal.nodejs.eventemitter"></a>
<a id="schema_global.NodeJS.EventEmitter"></a>
<a id="tocSglobal.nodejs.eventemitter"></a>
<a id="tocsglobal.nodejs.eventemitter"></a>

```json
{
  "type": "object",
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_global.BufferEncoding">global.BufferEncoding</h2>
<!-- backwards compatibility -->
<a id="schemaglobal.bufferencoding"></a>
<a id="schema_global.BufferEncoding"></a>
<a id="tocSglobal.bufferencoding"></a>
<a id="tocsglobal.bufferencoding"></a>

```json
{
  "type": "string",
  "enum": [
    "ascii",
    "utf8",
    "utf-8",
    "utf16le",
    "utf-16le",
    "ucs2",
    "ucs-2",
    "base64",
    "base64url",
    "latin1",
    "binary",
    "hex"
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|enum|[string]|false|none|none|

<h2 id="tocS_global.Buffer">global.Buffer</h2>
<!-- backwards compatibility -->
<a id="schemaglobal.buffer"></a>
<a id="schema_global.Buffer"></a>
<a id="tocSglobal.buffer"></a>
<a id="tocsglobal.buffer"></a>

```json
{
  "type": "object",
  "additionalProperties": {
    "type": "number"
  },
  "properties": {
    "BYTES_PER_ELEMENT": {
      "type": "number"
    },
    "buffer": {
      "type": "object",
      "properties": {
        "byteLength": {
          "type": "number"
        }
      },
      "required": [
        "byteLength"
      ],
      "additionalProperties": false
    },
    "byteLength": {
      "type": "number"
    },
    "byteOffset": {
      "type": "number"
    },
    "length": {
      "type": "number"
    }
  },
  "required": [
    "BYTES_PER_ELEMENT",
    "buffer",
    "byteLength",
    "byteOffset",
    "length"
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|additionalProperties|object|false|none|none|
|» type|string|false|none|none|
|properties|object|false|none|none|
|» BYTES_PER_ELEMENT|object|false|none|none|
|»» type|string|false|none|none|
|» buffer|object|false|none|none|
|»» type|string|false|none|none|
|»» properties|object|false|none|none|
|»»» byteLength|object|false|none|none|
|»»»» type|string|false|none|none|
|»» required|[string]|false|none|none|
|»» additionalProperties|boolean|false|none|none|
|» byteLength|object|false|none|none|
|»» type|string|false|none|none|
|» byteOffset|object|false|none|none|
|»» type|string|false|none|none|
|» length|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|

<h2 id="tocS_PatchKeyToSharingOperationDTO">PatchKeyToSharingOperationDTO</h2>
<!-- backwards compatibility -->
<a id="schemapatchkeytosharingoperationdto"></a>
<a id="schema_PatchKeyToSharingOperationDTO"></a>
<a id="tocSpatchkeytosharingoperationdto"></a>
<a id="tocspatchkeytosharingoperationdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id_key": {
      "type": "number"
    },
    "id_sharing": {
      "type": "number"
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    },
    "date": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "id_key",
    "id_sharing",
    "status",
    "date"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id_key|object|false|none|none|
|»» type|string|false|none|none|
|» id_sharing|object|false|none|none|
|»» type|string|false|none|none|
|» status|[SharingKeyStatus](#schemasharingkeystatus)|false|none|none|
|» date|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_PatchMeterToSharingOperationDTO">PatchMeterToSharingOperationDTO</h2>
<!-- backwards compatibility -->
<a id="schemapatchmetertosharingoperationdto"></a>
<a id="schema_PatchMeterToSharingOperationDTO"></a>
<a id="tocSpatchmetertosharingoperationdto"></a>
<a id="tocspatchmetertosharingoperationdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id_meter": {
      "type": "string"
    },
    "id_sharing": {
      "type": "number"
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3,
        4
      ]
    },
    "date": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "id_meter",
    "id_sharing",
    "status",
    "date"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id_meter|object|false|none|none|
|»» type|string|false|none|none|
|» id_sharing|object|false|none|none|
|»» type|string|false|none|none|
|» status|[MeterDataStatus](#schemameterdatastatus)|false|none|none|
|» date|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_MeterDataStatus">MeterDataStatus</h2>
<!-- backwards compatibility -->
<a id="schemameterdatastatus"></a>
<a id="schema_MeterDataStatus"></a>
<a id="tocSmeterdatastatus"></a>
<a id="tocsmeterdatastatus"></a>

```json
{
  "type": "number",
  "enum": [
    1,
    2,
    3,
    4
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|enum|[number]|false|none|none|

<h2 id="tocS_RemoveMeterFromSharingOperationDTO">RemoveMeterFromSharingOperationDTO</h2>
<!-- backwards compatibility -->
<a id="schemaremovemeterfromsharingoperationdto"></a>
<a id="schema_RemoveMeterFromSharingOperationDTO"></a>
<a id="tocSremovemeterfromsharingoperationdto"></a>
<a id="tocsremovemeterfromsharingoperationdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id_meter": {
      "type": "string"
    },
    "id_sharing": {
      "type": "number"
    },
    "date": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "id_meter",
    "id_sharing",
    "date"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id_meter|object|false|none|none|
|»» type|string|false|none|none|
|» id_sharing|object|false|none|none|
|»» type|string|false|none|none|
|» date|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_MemberPartialQuery">MemberPartialQuery</h2>
<!-- backwards compatibility -->
<a id="schemamemberpartialquery"></a>
<a id="schema_MemberPartialQuery"></a>
<a id="tocSmemberpartialquery"></a>
<a id="tocsmemberpartialquery"></a>

```json
{
  "type": "object",
  "properties": {
    "page": {
      "type": "number"
    },
    "limit": {
      "type": "number"
    },
    "name": {
      "type": "string"
    },
    "member_type": {
      "type": "number",
      "enum": [
        1,
        2
      ]
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    },
    "sort_name": {
      "type": "string",
      "enum": [
        "ASC",
        "DESC"
      ]
    }
  },
  "additionalProperties": false,
  "required": [
    "limit",
    "page"
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» page|object|false|none|none|
|»» type|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» member_type|[MemberType](#schemamembertype)|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|» sort_name|[Sort](#schemasort)|false|none|none|
|additionalProperties|boolean|false|none|none|
|required|[string]|false|none|none|

<h2 id="tocS_MemberType">MemberType</h2>
<!-- backwards compatibility -->
<a id="schemamembertype"></a>
<a id="schema_MemberType"></a>
<a id="tocSmembertype"></a>
<a id="tocsmembertype"></a>

```json
{
  "type": "number",
  "enum": [
    1,
    2
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|enum|[number]|false|none|none|

<h2 id="tocS_MemberStatus">MemberStatus</h2>
<!-- backwards compatibility -->
<a id="schemamemberstatus"></a>
<a id="schema_MemberStatus"></a>
<a id="tocSmemberstatus"></a>
<a id="tocsmemberstatus"></a>

```json
{
  "type": "number",
  "enum": [
    1,
    2,
    3
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|enum|[number]|false|none|none|

<h2 id="tocS_MembersPartialDTO">MembersPartialDTO</h2>
<!-- backwards compatibility -->
<a id="schemamemberspartialdto"></a>
<a id="schema_MembersPartialDTO"></a>
<a id="tocSmemberspartialdto"></a>
<a id="tocsmemberspartialdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "name": {
      "type": "string"
    },
    "member_type": {
      "type": "number",
      "enum": [
        1,
        2
      ]
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    }
  },
  "required": [
    "id",
    "name",
    "member_type",
    "status"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» member_type|[MemberType](#schemamembertype)|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_MemberDTO">MemberDTO</h2>
<!-- backwards compatibility -->
<a id="schemamemberdto"></a>
<a id="schema_MemberDTO"></a>
<a id="tocSmemberdto"></a>
<a id="tocsmemberdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "name": {
      "type": "string"
    },
    "member_type": {
      "type": "number",
      "enum": [
        1,
        2
      ]
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    },
    "iban": {
      "type": "string"
    },
    "home_address": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        },
        "city": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "street",
        "number",
        "postcode",
        "city"
      ],
      "additionalProperties": false
    },
    "billing_address": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        },
        "city": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "street",
        "number",
        "postcode",
        "city"
      ],
      "additionalProperties": false
    },
    "user_link_email": {
      "type": "string"
    }
  },
  "required": [
    "billing_address",
    "home_address",
    "iban",
    "id",
    "member_type",
    "name",
    "status"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» member_type|[MemberType](#schemamembertype)|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|» iban|object|false|none|none|
|»» type|string|false|none|none|
|» home_address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» billing_address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» user_link_email|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_ManagerDTO">ManagerDTO</h2>
<!-- backwards compatibility -->
<a id="schemamanagerdto"></a>
<a id="schema_ManagerDTO"></a>
<a id="tocSmanagerdto"></a>
<a id="tocsmanagerdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "NRN": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "surname": {
      "type": "string"
    },
    "email": {
      "type": "string"
    },
    "phone_number": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "NRN",
    "name",
    "surname",
    "email"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» NRN|object|false|none|none|
|»» type|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» surname|object|false|none|none|
|»» type|string|false|none|none|
|» email|object|false|none|none|
|»» type|string|false|none|none|
|» phone_number|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_IndividualDTO">IndividualDTO</h2>
<!-- backwards compatibility -->
<a id="schemaindividualdto"></a>
<a id="schema_IndividualDTO"></a>
<a id="tocSindividualdto"></a>
<a id="tocsindividualdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "name": {
      "type": "string"
    },
    "member_type": {
      "type": "number",
      "enum": [
        1,
        2
      ]
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    },
    "iban": {
      "type": "string"
    },
    "home_address": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        },
        "city": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "street",
        "number",
        "postcode",
        "city"
      ],
      "additionalProperties": false
    },
    "billing_address": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        },
        "city": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "street",
        "number",
        "postcode",
        "city"
      ],
      "additionalProperties": false
    },
    "user_link_email": {
      "type": "string"
    },
    "NRN": {
      "type": "string"
    },
    "first_name": {
      "type": "string"
    },
    "email": {
      "type": "string"
    },
    "phone_number": {
      "type": "string"
    },
    "social_rate": {
      "type": "boolean"
    },
    "manager": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "NRN": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "surname": {
          "type": "string"
        },
        "email": {
          "type": "string"
        },
        "phone_number": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "NRN",
        "name",
        "surname",
        "email"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "NRN",
    "billing_address",
    "email",
    "first_name",
    "home_address",
    "iban",
    "id",
    "member_type",
    "name",
    "phone_number",
    "social_rate",
    "status"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» member_type|[MemberType](#schemamembertype)|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|» iban|object|false|none|none|
|»» type|string|false|none|none|
|» home_address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» billing_address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» user_link_email|object|false|none|none|
|»» type|string|false|none|none|
|» NRN|object|false|none|none|
|»» type|string|false|none|none|
|» first_name|object|false|none|none|
|»» type|string|false|none|none|
|» email|object|false|none|none|
|»» type|string|false|none|none|
|» phone_number|object|false|none|none|
|»» type|string|false|none|none|
|» social_rate|object|false|none|none|
|»» type|string|false|none|none|
|» manager|[ManagerDTO](#schemamanagerdto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_CompanyDTO">CompanyDTO</h2>
<!-- backwards compatibility -->
<a id="schemacompanydto"></a>
<a id="schema_CompanyDTO"></a>
<a id="tocScompanydto"></a>
<a id="tocscompanydto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "name": {
      "type": "string"
    },
    "member_type": {
      "type": "number",
      "enum": [
        1,
        2
      ]
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    },
    "iban": {
      "type": "string"
    },
    "home_address": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        },
        "city": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "street",
        "number",
        "postcode",
        "city"
      ],
      "additionalProperties": false
    },
    "billing_address": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        },
        "city": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "street",
        "number",
        "postcode",
        "city"
      ],
      "additionalProperties": false
    },
    "user_link_email": {
      "type": "string"
    },
    "vat_number": {
      "type": "string"
    },
    "manager": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "NRN": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "surname": {
          "type": "string"
        },
        "email": {
          "type": "string"
        },
        "phone_number": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "NRN",
        "name",
        "surname",
        "email"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "billing_address",
    "home_address",
    "iban",
    "id",
    "manager",
    "member_type",
    "name",
    "status",
    "vat_number"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» member_type|[MemberType](#schemamembertype)|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|» iban|object|false|none|none|
|»» type|string|false|none|none|
|» home_address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» billing_address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» user_link_email|object|false|none|none|
|»» type|string|false|none|none|
|» vat_number|object|false|none|none|
|»» type|string|false|none|none|
|» manager|[ManagerDTO](#schemamanagerdto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_CreateMemberDTO">CreateMemberDTO</h2>
<!-- backwards compatibility -->
<a id="schemacreatememberdto"></a>
<a id="schema_CreateMemberDTO"></a>
<a id="tocScreatememberdto"></a>
<a id="tocscreatememberdto"></a>

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "member_type": {
      "type": "number",
      "enum": [
        1,
        2
      ]
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    },
    "iban": {
      "type": "string"
    },
    "home_address": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "city": {
          "type": "string"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        }
      },
      "required": [
        "street",
        "number",
        "city",
        "postcode"
      ],
      "additionalProperties": false
    },
    "billing_address": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "city": {
          "type": "string"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        }
      },
      "required": [
        "street",
        "number",
        "city",
        "postcode"
      ],
      "additionalProperties": false
    },
    "first_name": {
      "type": "string"
    },
    "NRN": {
      "type": "string"
    },
    "email": {
      "type": "string"
    },
    "phone_number": {
      "type": "string"
    },
    "social_rate": {
      "type": "boolean"
    },
    "vat_number": {
      "type": "string"
    },
    "manager_id": {
      "type": "number"
    }
  },
  "required": [
    "name",
    "member_type",
    "status",
    "iban",
    "home_address",
    "billing_address",
    "first_name",
    "NRN",
    "email",
    "social_rate",
    "vat_number"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» member_type|[MemberType](#schemamembertype)|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|» iban|object|false|none|none|
|»» type|string|false|none|none|
|» home_address|[CreateAddressDTO](#schemacreateaddressdto)|false|none|none|
|» billing_address|[CreateAddressDTO](#schemacreateaddressdto)|false|none|none|
|» first_name|object|false|none|none|
|»» type|string|false|none|none|
|» NRN|object|false|none|none|
|»» type|string|false|none|none|
|» email|object|false|none|none|
|»» type|string|false|none|none|
|» phone_number|object|false|none|none|
|»» type|string|false|none|none|
|» social_rate|object|false|none|none|
|»» type|string|false|none|none|
|» vat_number|object|false|none|none|
|»» type|string|false|none|none|
|» manager_id|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_UpdateMemberDTO">UpdateMemberDTO</h2>
<!-- backwards compatibility -->
<a id="schemaupdatememberdto"></a>
<a id="schema_UpdateMemberDTO"></a>
<a id="tocSupdatememberdto"></a>
<a id="tocsupdatememberdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "name": {
      "type": "string"
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    },
    "iban": {
      "type": "string"
    },
    "home_address": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "city": {
          "type": "string"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "billing_address": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "city": {
          "type": "string"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "first_name": {
      "type": "string"
    },
    "NRN": {
      "type": "string"
    },
    "email": {
      "type": "string"
    },
    "phone_number": {
      "type": "string"
    },
    "social_rate": {
      "type": "boolean"
    },
    "vat_number": {
      "type": "string"
    },
    "manager_id": {
      "type": "number"
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|» iban|object|false|none|none|
|»» type|string|false|none|none|
|» home_address|[UpdateAddressDTO](#schemaupdateaddressdto)|false|none|none|
|» billing_address|[UpdateAddressDTO](#schemaupdateaddressdto)|false|none|none|
|» first_name|object|false|none|none|
|»» type|string|false|none|none|
|» NRN|object|false|none|none|
|»» type|string|false|none|none|
|» email|object|false|none|none|
|»» type|string|false|none|none|
|» phone_number|object|false|none|none|
|»» type|string|false|none|none|
|» social_rate|object|false|none|none|
|»» type|string|false|none|none|
|» vat_number|object|false|none|none|
|»» type|string|false|none|none|
|» manager_id|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_PatchMemberStatusDTO">PatchMemberStatusDTO</h2>
<!-- backwards compatibility -->
<a id="schemapatchmemberstatusdto"></a>
<a id="schema_PatchMemberStatusDTO"></a>
<a id="tocSpatchmemberstatusdto"></a>
<a id="tocspatchmemberstatusdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id_member": {
      "type": "number"
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    }
  },
  "required": [
    "id_member",
    "status"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id_member|object|false|none|none|
|»» type|string|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_PatchMemberInviteUserDTO">PatchMemberInviteUserDTO</h2>
<!-- backwards compatibility -->
<a id="schemapatchmemberinviteuserdto"></a>
<a id="schema_PatchMemberInviteUserDTO"></a>
<a id="tocSpatchmemberinviteuserdto"></a>
<a id="tocspatchmemberinviteuserdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id_member": {
      "type": "number"
    },
    "user_email": {
      "type": "string"
    }
  },
  "required": [
    "id_member",
    "user_email"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id_member|object|false|none|none|
|»» type|string|false|none|none|
|» user_email|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_MemberLinkDTO">MemberLinkDTO</h2>
<!-- backwards compatibility -->
<a id="schemamemberlinkdto"></a>
<a id="schema_MemberLinkDTO"></a>
<a id="tocSmemberlinkdto"></a>
<a id="tocsmemberlinkdto"></a>

```json
{
  "type": "object",
  "properties": {
    "user_email": {
      "type": "string"
    },
    "user_id": {
      "type": "number"
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    }
  },
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» user_email|object|false|none|none|
|»» type|string|false|none|none|
|» user_id|object|false|none|none|
|»» type|string|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_MeterPartialQuery">MeterPartialQuery</h2>
<!-- backwards compatibility -->
<a id="schemameterpartialquery"></a>
<a id="schema_MeterPartialQuery"></a>
<a id="tocSmeterpartialquery"></a>
<a id="tocsmeterpartialquery"></a>

```json
{
  "type": "object",
  "properties": {
    "page": {
      "type": "number"
    },
    "limit": {
      "type": "number"
    },
    "street": {
      "type": "string"
    },
    "postcode": {
      "type": "number"
    },
    "address_number": {
      "type": "number"
    },
    "city": {
      "type": "string"
    },
    "supplement": {
      "type": "string"
    },
    "EAN": {
      "type": "string"
    },
    "meter_number": {
      "type": "string"
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3,
        4
      ]
    },
    "sharing_operation_id": {
      "type": "number"
    },
    "not_sharing_operation_id": {
      "type": "number"
    },
    "holder_id": {
      "type": "number"
    }
  },
  "additionalProperties": false,
  "required": [
    "limit",
    "page"
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» page|object|false|none|none|
|»» type|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|» street|object|false|none|none|
|»» type|string|false|none|none|
|» postcode|object|false|none|none|
|»» type|string|false|none|none|
|» address_number|object|false|none|none|
|»» type|string|false|none|none|
|» city|object|false|none|none|
|»» type|string|false|none|none|
|» supplement|object|false|none|none|
|»» type|string|false|none|none|
|» EAN|object|false|none|none|
|»» type|string|false|none|none|
|» meter_number|object|false|none|none|
|»» type|string|false|none|none|
|» status|[MeterDataStatus](#schemameterdatastatus)|false|none|none|
|» sharing_operation_id|object|false|none|none|
|»» type|string|false|none|none|
|» not_sharing_operation_id|object|false|none|none|
|»» type|string|false|none|none|
|» holder_id|object|false|none|none|
|»» type|string|false|none|none|
|additionalProperties|boolean|false|none|none|
|required|[string]|false|none|none|

<h2 id="tocS_MeterConsumptionQuery">MeterConsumptionQuery</h2>
<!-- backwards compatibility -->
<a id="schemameterconsumptionquery"></a>
<a id="schema_MeterConsumptionQuery"></a>
<a id="tocSmeterconsumptionquery"></a>
<a id="tocsmeterconsumptionquery"></a>

```json
{
  "type": "object",
  "properties": {
    "date_start": {
      "type": "string",
      "format": "date-time"
    },
    "date_end": {
      "type": "string",
      "format": "date-time"
    }
  },
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» date_start|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|» date_end|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_PartialMeterDTO">PartialMeterDTO</h2>
<!-- backwards compatibility -->
<a id="schemapartialmeterdto"></a>
<a id="schema_PartialMeterDTO"></a>
<a id="tocSpartialmeterdto"></a>
<a id="tocspartialmeterdto"></a>

```json
{
  "type": "object",
  "properties": {
    "EAN": {
      "type": "string"
    },
    "meter_number": {
      "type": "string"
    },
    "address": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        },
        "city": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "street",
        "number",
        "postcode",
        "city"
      ],
      "additionalProperties": false
    },
    "holder": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "name": {
          "type": "string"
        },
        "member_type": {
          "type": "number",
          "enum": [
            1,
            2
          ]
        },
        "status": {
          "type": "number",
          "enum": [
            1,
            2,
            3
          ]
        }
      },
      "required": [
        "id",
        "name",
        "member_type",
        "status"
      ],
      "additionalProperties": false
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3,
        4
      ]
    },
    "sharing_operation": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "name": {
          "type": "string"
        },
        "type": {
          "type": "number",
          "enum": [
            1,
            2,
            3
          ]
        }
      },
      "required": [
        "id",
        "name",
        "type"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "EAN",
    "meter_number",
    "address",
    "status"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» EAN|object|false|none|none|
|»» type|string|false|none|none|
|» meter_number|object|false|none|none|
|»» type|string|false|none|none|
|» address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» holder|[MembersPartialDTO](#schemamemberspartialdto)|false|none|none|
|» status|[MeterDataStatus](#schemameterdatastatus)|false|none|none|
|» sharing_operation|[SharingOperationPartialDTO](#schemasharingoperationpartialdto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_MetersDataDTO">MetersDataDTO</h2>
<!-- backwards compatibility -->
<a id="schemametersdatadto"></a>
<a id="schema_MetersDataDTO"></a>
<a id="tocSmetersdatadto"></a>
<a id="tocsmetersdatadto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "description": {
      "type": "string"
    },
    "sampling_power": {
      "type": "number"
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3,
        4
      ]
    },
    "amperage": {
      "type": "number"
    },
    "rate": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    },
    "client_type": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    },
    "start_date": {
      "type": "string",
      "format": "date-time"
    },
    "end_date": {
      "type": "string",
      "format": "date-time"
    },
    "injection_status": {
      "type": "number",
      "enum": [
        1,
        2,
        3,
        4
      ]
    },
    "production_chain": {
      "type": "number",
      "enum": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "totalGenerating_capacity": {
      "type": "number"
    },
    "member": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "name": {
          "type": "string"
        },
        "member_type": {
          "type": "number",
          "enum": [
            1,
            2
          ]
        },
        "status": {
          "type": "number",
          "enum": [
            1,
            2,
            3
          ]
        }
      },
      "required": [
        "id",
        "name",
        "member_type",
        "status"
      ],
      "additionalProperties": false
    },
    "grd": {
      "type": "string"
    },
    "sharing_operation": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "name": {
          "type": "string"
        },
        "type": {
          "type": "number",
          "enum": [
            1,
            2,
            3
          ]
        }
      },
      "required": [
        "id",
        "name",
        "type"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "id",
    "description",
    "sampling_power",
    "status",
    "amperage",
    "rate",
    "client_type",
    "start_date",
    "end_date",
    "injection_status",
    "production_chain",
    "totalGenerating_capacity",
    "grd"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» description|object|false|none|none|
|»» type|string|false|none|none|
|» sampling_power|object|false|none|none|
|»» type|string|false|none|none|
|» status|[MeterDataStatus](#schemameterdatastatus)|false|none|none|
|» amperage|object|false|none|none|
|»» type|string|false|none|none|
|» rate|[MeterRate](#schemameterrate)|false|none|none|
|» client_type|[ClientType](#schemaclienttype)|false|none|none|
|» start_date|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|» end_date|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|» injection_status|[InjectionStatus](#schemainjectionstatus)|false|none|none|
|» production_chain|[ProductionChain](#schemaproductionchain)|false|none|none|
|» totalGenerating_capacity|object|false|none|none|
|»» type|string|false|none|none|
|» member|[MembersPartialDTO](#schemamemberspartialdto)|false|none|none|
|» grd|object|false|none|none|
|»» type|string|false|none|none|
|» sharing_operation|[SharingOperationPartialDTO](#schemasharingoperationpartialdto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_MeterRate">MeterRate</h2>
<!-- backwards compatibility -->
<a id="schemameterrate"></a>
<a id="schema_MeterRate"></a>
<a id="tocSmeterrate"></a>
<a id="tocsmeterrate"></a>

```json
{
  "type": "number",
  "enum": [
    1,
    2,
    3
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|enum|[number]|false|none|none|

<h2 id="tocS_ClientType">ClientType</h2>
<!-- backwards compatibility -->
<a id="schemaclienttype"></a>
<a id="schema_ClientType"></a>
<a id="tocSclienttype"></a>
<a id="tocsclienttype"></a>

```json
{
  "type": "number",
  "enum": [
    1,
    2,
    3
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|enum|[number]|false|none|none|

<h2 id="tocS_InjectionStatus">InjectionStatus</h2>
<!-- backwards compatibility -->
<a id="schemainjectionstatus"></a>
<a id="schema_InjectionStatus"></a>
<a id="tocSinjectionstatus"></a>
<a id="tocsinjectionstatus"></a>

```json
{
  "type": "number",
  "enum": [
    1,
    2,
    3,
    4
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|enum|[number]|false|none|none|

<h2 id="tocS_ProductionChain">ProductionChain</h2>
<!-- backwards compatibility -->
<a id="schemaproductionchain"></a>
<a id="schema_ProductionChain"></a>
<a id="tocSproductionchain"></a>
<a id="tocsproductionchain"></a>

```json
{
  "type": "number",
  "enum": [
    1,
    2,
    3,
    4,
    5,
    6,
    7
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|enum|[number]|false|none|none|

<h2 id="tocS_MetersDTO">MetersDTO</h2>
<!-- backwards compatibility -->
<a id="schemametersdto"></a>
<a id="schema_MetersDTO"></a>
<a id="tocSmetersdto"></a>
<a id="tocsmetersdto"></a>

```json
{
  "type": "object",
  "properties": {
    "EAN": {
      "type": "string"
    },
    "meter_number": {
      "type": "string"
    },
    "address": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        },
        "city": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "street",
        "number",
        "postcode",
        "city"
      ],
      "additionalProperties": false
    },
    "holder": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "name": {
          "type": "string"
        },
        "member_type": {
          "type": "number",
          "enum": [
            1,
            2
          ]
        },
        "status": {
          "type": "number",
          "enum": [
            1,
            2,
            3
          ]
        }
      },
      "required": [
        "id",
        "name",
        "member_type",
        "status"
      ],
      "additionalProperties": false
    },
    "tarif_group": {
      "type": "number",
      "enum": [
        1,
        2
      ]
    },
    "phases_number": {
      "type": "number"
    },
    "reading_frequency": {
      "type": "number",
      "enum": [
        1,
        2
      ]
    },
    "meter_data": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "description": {
          "type": "string"
        },
        "sampling_power": {
          "type": "number"
        },
        "status": {
          "type": "number",
          "enum": [
            1,
            2,
            3,
            4
          ]
        },
        "amperage": {
          "type": "number"
        },
        "rate": {
          "type": "number",
          "enum": [
            1,
            2,
            3
          ]
        },
        "client_type": {
          "type": "number",
          "enum": [
            1,
            2,
            3
          ]
        },
        "start_date": {
          "type": "string",
          "format": "date-time"
        },
        "end_date": {
          "type": "string",
          "format": "date-time"
        },
        "injection_status": {
          "type": "number",
          "enum": [
            1,
            2,
            3,
            4
          ]
        },
        "production_chain": {
          "type": "number",
          "enum": [
            1,
            2,
            3,
            4,
            5,
            6,
            7
          ]
        },
        "totalGenerating_capacity": {
          "type": "number"
        },
        "member": {
          "type": "object",
          "properties": {
            "id": {
              "type": "number"
            },
            "name": {
              "type": "string"
            },
            "member_type": {
              "type": "number",
              "enum": [
                1,
                2
              ]
            },
            "status": {
              "type": "number",
              "enum": [
                1,
                2,
                3
              ]
            }
          },
          "required": [
            "id",
            "name",
            "member_type",
            "status"
          ],
          "additionalProperties": false
        },
        "grd": {
          "type": "string"
        },
        "sharing_operation": {
          "type": "object",
          "properties": {
            "id": {
              "type": "number"
            },
            "name": {
              "type": "string"
            },
            "type": {
              "type": "number",
              "enum": [
                1,
                2,
                3
              ]
            }
          },
          "required": [
            "id",
            "name",
            "type"
          ],
          "additionalProperties": false
        }
      },
      "required": [
        "id",
        "description",
        "sampling_power",
        "status",
        "amperage",
        "rate",
        "client_type",
        "start_date",
        "end_date",
        "injection_status",
        "production_chain",
        "totalGenerating_capacity",
        "grd"
      ],
      "additionalProperties": false
    },
    "meter_data_history": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "number"
          },
          "description": {
            "type": "string"
          },
          "sampling_power": {
            "type": "number"
          },
          "status": {
            "type": "number",
            "enum": [
              1,
              2,
              3,
              4
            ]
          },
          "amperage": {
            "type": "number"
          },
          "rate": {
            "type": "number",
            "enum": [
              1,
              2,
              3
            ]
          },
          "client_type": {
            "type": "number",
            "enum": [
              1,
              2,
              3
            ]
          },
          "start_date": {
            "type": "string",
            "format": "date-time"
          },
          "end_date": {
            "type": "string",
            "format": "date-time"
          },
          "injection_status": {
            "type": "number",
            "enum": [
              1,
              2,
              3,
              4
            ]
          },
          "production_chain": {
            "type": "number",
            "enum": [
              1,
              2,
              3,
              4,
              5,
              6,
              7
            ]
          },
          "totalGenerating_capacity": {
            "type": "number"
          },
          "member": {
            "type": "object",
            "properties": {
              "id": {
                "type": "number"
              },
              "name": {
                "type": "string"
              },
              "member_type": {
                "type": "number",
                "enum": [
                  1,
                  2
                ]
              },
              "status": {
                "type": "number",
                "enum": [
                  1,
                  2,
                  3
                ]
              }
            },
            "required": [
              "id",
              "name",
              "member_type",
              "status"
            ],
            "additionalProperties": false
          },
          "grd": {
            "type": "string"
          },
          "sharing_operation": {
            "type": "object",
            "properties": {
              "id": {
                "type": "number"
              },
              "name": {
                "type": "string"
              },
              "type": {
                "type": "number",
                "enum": [
                  1,
                  2,
                  3
                ]
              }
            },
            "required": [
              "id",
              "name",
              "type"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "id",
          "description",
          "sampling_power",
          "status",
          "amperage",
          "rate",
          "client_type",
          "start_date",
          "end_date",
          "injection_status",
          "production_chain",
          "totalGenerating_capacity",
          "grd"
        ],
        "additionalProperties": false
      }
    },
    "futur_meter_data": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "number"
          },
          "description": {
            "type": "string"
          },
          "sampling_power": {
            "type": "number"
          },
          "status": {
            "type": "number",
            "enum": [
              1,
              2,
              3,
              4
            ]
          },
          "amperage": {
            "type": "number"
          },
          "rate": {
            "type": "number",
            "enum": [
              1,
              2,
              3
            ]
          },
          "client_type": {
            "type": "number",
            "enum": [
              1,
              2,
              3
            ]
          },
          "start_date": {
            "type": "string",
            "format": "date-time"
          },
          "end_date": {
            "type": "string",
            "format": "date-time"
          },
          "injection_status": {
            "type": "number",
            "enum": [
              1,
              2,
              3,
              4
            ]
          },
          "production_chain": {
            "type": "number",
            "enum": [
              1,
              2,
              3,
              4,
              5,
              6,
              7
            ]
          },
          "totalGenerating_capacity": {
            "type": "number"
          },
          "member": {
            "type": "object",
            "properties": {
              "id": {
                "type": "number"
              },
              "name": {
                "type": "string"
              },
              "member_type": {
                "type": "number",
                "enum": [
                  1,
                  2
                ]
              },
              "status": {
                "type": "number",
                "enum": [
                  1,
                  2,
                  3
                ]
              }
            },
            "required": [
              "id",
              "name",
              "member_type",
              "status"
            ],
            "additionalProperties": false
          },
          "grd": {
            "type": "string"
          },
          "sharing_operation": {
            "type": "object",
            "properties": {
              "id": {
                "type": "number"
              },
              "name": {
                "type": "string"
              },
              "type": {
                "type": "number",
                "enum": [
                  1,
                  2,
                  3
                ]
              }
            },
            "required": [
              "id",
              "name",
              "type"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "id",
          "description",
          "sampling_power",
          "status",
          "amperage",
          "rate",
          "client_type",
          "start_date",
          "end_date",
          "injection_status",
          "production_chain",
          "totalGenerating_capacity",
          "grd"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "EAN",
    "meter_number",
    "address",
    "tarif_group",
    "phases_number",
    "reading_frequency"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» EAN|object|false|none|none|
|»» type|string|false|none|none|
|» meter_number|object|false|none|none|
|»» type|string|false|none|none|
|» address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» holder|[MembersPartialDTO](#schemamemberspartialdto)|false|none|none|
|» tarif_group|[TarifGroup](#schematarifgroup)|false|none|none|
|» phases_number|object|false|none|none|
|»» type|string|false|none|none|
|» reading_frequency|[ReadingFrequency](#schemareadingfrequency)|false|none|none|
|» meter_data|[MetersDataDTO](#schemametersdatadto)|false|none|none|
|» meter_data_history|object|false|none|none|
|»» type|string|false|none|none|
|»» items|[MetersDataDTO](#schemametersdatadto)|false|none|none|
|» futur_meter_data|object|false|none|none|
|»» type|string|false|none|none|
|»» items|[MetersDataDTO](#schemametersdatadto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_TarifGroup">TarifGroup</h2>
<!-- backwards compatibility -->
<a id="schematarifgroup"></a>
<a id="schema_TarifGroup"></a>
<a id="tocStarifgroup"></a>
<a id="tocstarifgroup"></a>

```json
{
  "type": "number",
  "enum": [
    1,
    2
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|enum|[number]|false|none|none|

<h2 id="tocS_ReadingFrequency">ReadingFrequency</h2>
<!-- backwards compatibility -->
<a id="schemareadingfrequency"></a>
<a id="schema_ReadingFrequency"></a>
<a id="tocSreadingfrequency"></a>
<a id="tocsreadingfrequency"></a>

```json
{
  "type": "number",
  "enum": [
    1,
    2
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|enum|[number]|false|none|none|

<h2 id="tocS_MeterConsumptionDTO">MeterConsumptionDTO</h2>
<!-- backwards compatibility -->
<a id="schemameterconsumptiondto"></a>
<a id="schema_MeterConsumptionDTO"></a>
<a id="tocSmeterconsumptiondto"></a>
<a id="tocsmeterconsumptiondto"></a>

```json
{
  "type": "object",
  "properties": {
    "EAN": {
      "type": "string"
    },
    "timestamps": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "gross": {
      "type": "array",
      "items": {
        "type": "number"
      }
    },
    "net": {
      "type": "array",
      "items": {
        "type": "number"
      }
    },
    "shared": {
      "type": "array",
      "items": {
        "type": "number"
      }
    },
    "inj_gross": {
      "type": "array",
      "items": {
        "type": "number"
      }
    },
    "inj_net": {
      "type": "array",
      "items": {
        "type": "number"
      }
    },
    "inj_shared": {
      "type": "array",
      "items": {
        "type": "number"
      }
    }
  },
  "required": [
    "EAN",
    "timestamps",
    "gross",
    "net",
    "shared",
    "inj_gross",
    "inj_net",
    "inj_shared"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» EAN|object|false|none|none|
|»» type|string|false|none|none|
|» timestamps|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|» gross|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|» net|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|» shared|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|» inj_gross|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|» inj_net|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|» inj_shared|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_CreateMeterDataDTO">CreateMeterDataDTO</h2>
<!-- backwards compatibility -->
<a id="schemacreatemeterdatadto"></a>
<a id="schema_CreateMeterDataDTO"></a>
<a id="tocScreatemeterdatadto"></a>
<a id="tocscreatemeterdatadto"></a>

```json
{
  "type": "object",
  "properties": {
    "start_date": {
      "type": "string",
      "format": "date-time"
    },
    "end_date": {
      "type": "string",
      "format": "date-time"
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3,
        4
      ]
    },
    "rate": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    },
    "client_type": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    },
    "description": {
      "type": "string"
    },
    "sampling_power": {
      "type": "number"
    },
    "amperage": {
      "type": "number"
    },
    "grd": {
      "type": "string"
    },
    "injection_status": {
      "type": "number",
      "enum": [
        1,
        2,
        3,
        4
      ]
    },
    "production_chain": {
      "type": "number",
      "enum": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "total_generating_capacity": {
      "type": "number"
    },
    "member_id": {
      "type": "number"
    },
    "sharing_operation_id": {
      "type": "number"
    }
  },
  "required": [
    "start_date",
    "status",
    "rate",
    "client_type"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» start_date|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|» end_date|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|» status|[MeterDataStatus](#schemameterdatastatus)|false|none|none|
|» rate|[MeterRate](#schemameterrate)|false|none|none|
|» client_type|[ClientType](#schemaclienttype)|false|none|none|
|» description|object|false|none|none|
|»» type|string|false|none|none|
|» sampling_power|object|false|none|none|
|»» type|string|false|none|none|
|» amperage|object|false|none|none|
|»» type|string|false|none|none|
|» grd|object|false|none|none|
|»» type|string|false|none|none|
|» injection_status|[InjectionStatus](#schemainjectionstatus)|false|none|none|
|» production_chain|[ProductionChain](#schemaproductionchain)|false|none|none|
|» total_generating_capacity|object|false|none|none|
|»» type|string|false|none|none|
|» member_id|object|false|none|none|
|»» type|string|false|none|none|
|» sharing_operation_id|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_CreateMeterDTO">CreateMeterDTO</h2>
<!-- backwards compatibility -->
<a id="schemacreatemeterdto"></a>
<a id="schema_CreateMeterDTO"></a>
<a id="tocScreatemeterdto"></a>
<a id="tocscreatemeterdto"></a>

```json
{
  "type": "object",
  "properties": {
    "EAN": {
      "type": "string"
    },
    "meter_number": {
      "type": "string"
    },
    "address": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string"
        },
        "number": {
          "type": "number"
        },
        "city": {
          "type": "string"
        },
        "postcode": {
          "type": "string"
        },
        "supplement": {
          "type": "string"
        }
      },
      "required": [
        "street",
        "number",
        "city",
        "postcode"
      ],
      "additionalProperties": false
    },
    "tarif_group": {
      "type": "number",
      "enum": [
        1,
        2
      ]
    },
    "phases_number": {
      "type": "number"
    },
    "reading_frequency": {
      "type": "number",
      "enum": [
        1,
        2
      ]
    },
    "initial_data": {
      "type": "object",
      "properties": {
        "start_date": {
          "type": "string",
          "format": "date-time"
        },
        "end_date": {
          "type": "string",
          "format": "date-time"
        },
        "status": {
          "type": "number",
          "enum": [
            1,
            2,
            3,
            4
          ]
        },
        "rate": {
          "type": "number",
          "enum": [
            1,
            2,
            3
          ]
        },
        "client_type": {
          "type": "number",
          "enum": [
            1,
            2,
            3
          ]
        },
        "description": {
          "type": "string"
        },
        "sampling_power": {
          "type": "number"
        },
        "amperage": {
          "type": "number"
        },
        "grd": {
          "type": "string"
        },
        "injection_status": {
          "type": "number",
          "enum": [
            1,
            2,
            3,
            4
          ]
        },
        "production_chain": {
          "type": "number",
          "enum": [
            1,
            2,
            3,
            4,
            5,
            6,
            7
          ]
        },
        "total_generating_capacity": {
          "type": "number"
        },
        "member_id": {
          "type": "number"
        },
        "sharing_operation_id": {
          "type": "number"
        }
      },
      "required": [
        "start_date",
        "status",
        "rate",
        "client_type"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "EAN",
    "meter_number",
    "address",
    "tarif_group",
    "phases_number",
    "reading_frequency",
    "initial_data"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» EAN|object|false|none|none|
|»» type|string|false|none|none|
|» meter_number|object|false|none|none|
|»» type|string|false|none|none|
|» address|[CreateAddressDTO](#schemacreateaddressdto)|false|none|none|
|» tarif_group|[TarifGroup](#schematarifgroup)|false|none|none|
|» phases_number|object|false|none|none|
|»» type|string|false|none|none|
|» reading_frequency|[ReadingFrequency](#schemareadingfrequency)|false|none|none|
|» initial_data|[CreateMeterDataDTO](#schemacreatemeterdatadto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_PatchMeterDataDTO">PatchMeterDataDTO</h2>
<!-- backwards compatibility -->
<a id="schemapatchmeterdatadto"></a>
<a id="schema_PatchMeterDataDTO"></a>
<a id="tocSpatchmeterdatadto"></a>
<a id="tocspatchmeterdatadto"></a>

```json
{
  "type": "object",
  "properties": {
    "start_date": {
      "type": "string",
      "format": "date-time"
    },
    "end_date": {
      "type": "string",
      "format": "date-time"
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3,
        4
      ]
    },
    "rate": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    },
    "client_type": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    },
    "description": {
      "type": "string"
    },
    "sampling_power": {
      "type": "number"
    },
    "amperage": {
      "type": "number"
    },
    "grd": {
      "type": "string"
    },
    "injection_status": {
      "type": "number",
      "enum": [
        1,
        2,
        3,
        4
      ]
    },
    "production_chain": {
      "type": "number",
      "enum": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    "total_generating_capacity": {
      "type": "number"
    },
    "member_id": {
      "type": "number"
    },
    "sharing_operation_id": {
      "type": "number"
    },
    "EAN": {
      "type": "string"
    }
  },
  "required": [
    "EAN",
    "client_type",
    "rate",
    "start_date",
    "status"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» start_date|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|» end_date|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|» status|[MeterDataStatus](#schemameterdatastatus)|false|none|none|
|» rate|[MeterRate](#schemameterrate)|false|none|none|
|» client_type|[ClientType](#schemaclienttype)|false|none|none|
|» description|object|false|none|none|
|»» type|string|false|none|none|
|» sampling_power|object|false|none|none|
|»» type|string|false|none|none|
|» amperage|object|false|none|none|
|»» type|string|false|none|none|
|» grd|object|false|none|none|
|»» type|string|false|none|none|
|» injection_status|[InjectionStatus](#schemainjectionstatus)|false|none|none|
|» production_chain|[ProductionChain](#schemaproductionchain)|false|none|none|
|» total_generating_capacity|object|false|none|none|
|»» type|string|false|none|none|
|» member_id|object|false|none|none|
|»» type|string|false|none|none|
|» sharing_operation_id|object|false|none|none|
|»» type|string|false|none|none|
|» EAN|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_CommunityQueryDTO">CommunityQueryDTO</h2>
<!-- backwards compatibility -->
<a id="schemacommunityquerydto"></a>
<a id="schema_CommunityQueryDTO"></a>
<a id="tocScommunityquerydto"></a>
<a id="tocscommunityquerydto"></a>

```json
{
  "type": "object",
  "properties": {
    "page": {
      "type": "number"
    },
    "limit": {
      "type": "number"
    },
    "name": {
      "type": "string"
    },
    "sort_name": {
      "type": "string",
      "enum": [
        "ASC",
        "DESC"
      ]
    },
    "sort_id": {
      "type": "string",
      "enum": [
        "ASC",
        "DESC"
      ]
    }
  },
  "additionalProperties": false,
  "required": [
    "limit",
    "page"
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» page|object|false|none|none|
|»» type|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» sort_name|[Sort](#schemasort)|false|none|none|
|» sort_id|[Sort](#schemasort)|false|none|none|
|additionalProperties|boolean|false|none|none|
|required|[string]|false|none|none|

<h2 id="tocS_CommunityUsersQueryDTO">CommunityUsersQueryDTO</h2>
<!-- backwards compatibility -->
<a id="schemacommunityusersquerydto"></a>
<a id="schema_CommunityUsersQueryDTO"></a>
<a id="tocScommunityusersquerydto"></a>
<a id="tocscommunityusersquerydto"></a>

```json
{
  "type": "object",
  "properties": {
    "page": {
      "type": "number"
    },
    "limit": {
      "type": "number"
    },
    "email": {
      "type": "string"
    },
    "role": {
      "type": "string",
      "enum": [
        "MEMBER",
        "MANAGER",
        "ADMIN"
      ]
    },
    "sort_email": {
      "type": "string",
      "enum": [
        "ASC",
        "DESC"
      ]
    },
    "sort_id": {
      "type": "string",
      "enum": [
        "ASC",
        "DESC"
      ]
    },
    "sort_role": {
      "type": "string",
      "enum": [
        "ASC",
        "DESC"
      ]
    }
  },
  "additionalProperties": false,
  "required": [
    "limit",
    "page"
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» page|object|false|none|none|
|»» type|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|» email|object|false|none|none|
|»» type|string|false|none|none|
|» role|[Role](#schemarole)|false|none|none|
|» sort_email|[Sort](#schemasort)|false|none|none|
|» sort_id|[Sort](#schemasort)|false|none|none|
|» sort_role|[Sort](#schemasort)|false|none|none|
|additionalProperties|boolean|false|none|none|
|required|[string]|false|none|none|

<h2 id="tocS_Role">Role</h2>
<!-- backwards compatibility -->
<a id="schemarole"></a>
<a id="schema_Role"></a>
<a id="tocSrole"></a>
<a id="tocsrole"></a>

```json
{
  "type": "string",
  "enum": [
    "MEMBER",
    "MANAGER",
    "ADMIN"
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|enum|[string]|false|none|none|

<h2 id="tocS_CommunityDTO">CommunityDTO</h2>
<!-- backwards compatibility -->
<a id="schemacommunitydto"></a>
<a id="schema_CommunityDTO"></a>
<a id="tocScommunitydto"></a>
<a id="tocscommunitydto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "name": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "name"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_MyCommunityDTO">MyCommunityDTO</h2>
<!-- backwards compatibility -->
<a id="schemamycommunitydto"></a>
<a id="schema_MyCommunityDTO"></a>
<a id="tocSmycommunitydto"></a>
<a id="tocsmycommunitydto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "auth_community_id": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "role": {
      "type": "string",
      "enum": [
        "MEMBER",
        "MANAGER",
        "ADMIN"
      ]
    }
  },
  "required": [
    "id",
    "auth_community_id",
    "name",
    "role"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» auth_community_id|object|false|none|none|
|»» type|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» role|[Role](#schemarole)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_UsersCommunityDTO">UsersCommunityDTO</h2>
<!-- backwards compatibility -->
<a id="schemauserscommunitydto"></a>
<a id="schema_UsersCommunityDTO"></a>
<a id="tocSuserscommunitydto"></a>
<a id="tocsuserscommunitydto"></a>

```json
{
  "type": "object",
  "properties": {
    "id_user": {
      "type": "number"
    },
    "id_community": {
      "type": "number"
    },
    "email": {
      "type": "string"
    },
    "role": {
      "type": "string",
      "enum": [
        "MEMBER",
        "MANAGER",
        "ADMIN"
      ]
    }
  },
  "required": [
    "id_user",
    "id_community",
    "email",
    "role"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id_user|object|false|none|none|
|»» type|string|false|none|none|
|» id_community|object|false|none|none|
|»» type|string|false|none|none|
|» email|object|false|none|none|
|»» type|string|false|none|none|
|» role|[Role](#schemarole)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_CreateCommunityDTO">CreateCommunityDTO</h2>
<!-- backwards compatibility -->
<a id="schemacreatecommunitydto"></a>
<a id="schema_CreateCommunityDTO"></a>
<a id="tocScreatecommunitydto"></a>
<a id="tocscreatecommunitydto"></a>

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    }
  },
  "required": [
    "name"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_PatchRoleUserDTO">PatchRoleUserDTO</h2>
<!-- backwards compatibility -->
<a id="schemapatchroleuserdto"></a>
<a id="schema_PatchRoleUserDTO"></a>
<a id="tocSpatchroleuserdto"></a>
<a id="tocspatchroleuserdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id_user": {
      "type": "number"
    },
    "new_role": {
      "type": "string",
      "enum": [
        "MEMBER",
        "MANAGER",
        "ADMIN"
      ]
    }
  },
  "required": [
    "id_user",
    "new_role"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id_user|object|false|none|none|
|»» type|string|false|none|none|
|» new_role|[Role](#schemarole)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_UserMemberInvitationQuery">UserMemberInvitationQuery</h2>
<!-- backwards compatibility -->
<a id="schemausermemberinvitationquery"></a>
<a id="schema_UserMemberInvitationQuery"></a>
<a id="tocSusermemberinvitationquery"></a>
<a id="tocsusermemberinvitationquery"></a>

```json
{
  "type": "object",
  "properties": {
    "page": {
      "type": "number"
    },
    "limit": {
      "type": "number"
    },
    "name": {
      "type": "string"
    },
    "to_be_encoded": {
      "type": "boolean"
    },
    "sort_name": {
      "type": "string",
      "enum": [
        "ASC",
        "DESC"
      ]
    },
    "sort_date": {
      "type": "string",
      "enum": [
        "ASC",
        "DESC"
      ]
    }
  },
  "additionalProperties": false,
  "required": [
    "limit",
    "page"
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» page|object|false|none|none|
|»» type|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» to_be_encoded|object|false|none|none|
|»» type|string|false|none|none|
|» sort_name|[Sort](#schemasort)|false|none|none|
|» sort_date|[Sort](#schemasort)|false|none|none|
|additionalProperties|boolean|false|none|none|
|required|[string]|false|none|none|

<h2 id="tocS_UserMemberInvitationDTO">UserMemberInvitationDTO</h2>
<!-- backwards compatibility -->
<a id="schemausermemberinvitationdto"></a>
<a id="schema_UserMemberInvitationDTO"></a>
<a id="tocSusermemberinvitationdto"></a>
<a id="tocsusermemberinvitationdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "member_id": {
      "type": "number"
    },
    "member_name": {
      "type": "string"
    },
    "user_email": {
      "type": "string"
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "to_be_encoded": {
      "type": "boolean"
    },
    "community": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "name": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "id",
    "user_email",
    "created_at",
    "to_be_encoded",
    "community"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» member_id|object|false|none|none|
|»» type|string|false|none|none|
|» member_name|object|false|none|none|
|»» type|string|false|none|none|
|» user_email|object|false|none|none|
|»» type|string|false|none|none|
|» created_at|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|» to_be_encoded|object|false|none|none|
|»» type|string|false|none|none|
|» community|[CommunityDTO](#schemacommunitydto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_UserManagerInvitationQuery">UserManagerInvitationQuery</h2>
<!-- backwards compatibility -->
<a id="schemausermanagerinvitationquery"></a>
<a id="schema_UserManagerInvitationQuery"></a>
<a id="tocSusermanagerinvitationquery"></a>
<a id="tocsusermanagerinvitationquery"></a>

```json
{
  "type": "object",
  "properties": {
    "page": {
      "type": "number"
    },
    "limit": {
      "type": "number"
    },
    "name": {
      "type": "string"
    },
    "sort_name": {
      "type": "string",
      "enum": [
        "ASC",
        "DESC"
      ]
    },
    "sort_date": {
      "type": "string",
      "enum": [
        "ASC",
        "DESC"
      ]
    }
  },
  "additionalProperties": false,
  "required": [
    "limit",
    "page"
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» page|object|false|none|none|
|»» type|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|» sort_name|[Sort](#schemasort)|false|none|none|
|» sort_date|[Sort](#schemasort)|false|none|none|
|additionalProperties|boolean|false|none|none|
|required|[string]|false|none|none|

<h2 id="tocS_UserManagerInvitationDTO">UserManagerInvitationDTO</h2>
<!-- backwards compatibility -->
<a id="schemausermanagerinvitationdto"></a>
<a id="schema_UserManagerInvitationDTO"></a>
<a id="tocSusermanagerinvitationdto"></a>
<a id="tocsusermanagerinvitationdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "user_email": {
      "type": "string"
    },
    "community": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        },
        "name": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "id",
    "user_email",
    "community",
    "created_at"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» user_email|object|false|none|none|
|»» type|string|false|none|none|
|» community|[CommunityDTO](#schemacommunitydto)|false|none|none|
|» created_at|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_InviteUser">InviteUser</h2>
<!-- backwards compatibility -->
<a id="schemainviteuser"></a>
<a id="schema_InviteUser"></a>
<a id="tocSinviteuser"></a>
<a id="tocsinviteuser"></a>

```json
{
  "type": "object",
  "properties": {
    "user_email": {
      "type": "string"
    }
  },
  "required": [
    "user_email"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» user_email|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_AcceptInvitationDTO">AcceptInvitationDTO</h2>
<!-- backwards compatibility -->
<a id="schemaacceptinvitationdto"></a>
<a id="schema_AcceptInvitationDTO"></a>
<a id="tocSacceptinvitationdto"></a>
<a id="tocsacceptinvitationdto"></a>

```json
{
  "type": "object",
  "properties": {
    "invitation_id": {
      "type": "number"
    }
  },
  "required": [
    "invitation_id"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» invitation_id|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_AcceptInvitationWEncodedDTO">AcceptInvitationWEncodedDTO</h2>
<!-- backwards compatibility -->
<a id="schemaacceptinvitationwencodeddto"></a>
<a id="schema_AcceptInvitationWEncodedDTO"></a>
<a id="tocSacceptinvitationwencodeddto"></a>
<a id="tocsacceptinvitationwencodeddto"></a>

```json
{
  "type": "object",
  "properties": {
    "invitation_id": {
      "type": "number"
    },
    "member": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "member_type": {
          "type": "number",
          "enum": [
            1,
            2
          ]
        },
        "status": {
          "type": "number",
          "enum": [
            1,
            2,
            3
          ]
        },
        "iban": {
          "type": "string"
        },
        "home_address": {
          "type": "object",
          "properties": {
            "street": {
              "type": "string"
            },
            "number": {
              "type": "number"
            },
            "city": {
              "type": "string"
            },
            "postcode": {
              "type": "string"
            },
            "supplement": {
              "type": "string"
            }
          },
          "required": [
            "street",
            "number",
            "city",
            "postcode"
          ],
          "additionalProperties": false
        },
        "billing_address": {
          "type": "object",
          "properties": {
            "street": {
              "type": "string"
            },
            "number": {
              "type": "number"
            },
            "city": {
              "type": "string"
            },
            "postcode": {
              "type": "string"
            },
            "supplement": {
              "type": "string"
            }
          },
          "required": [
            "street",
            "number",
            "city",
            "postcode"
          ],
          "additionalProperties": false
        },
        "first_name": {
          "type": "string"
        },
        "NRN": {
          "type": "string"
        },
        "email": {
          "type": "string"
        },
        "phone_number": {
          "type": "string"
        },
        "social_rate": {
          "type": "boolean"
        },
        "vat_number": {
          "type": "string"
        },
        "manager_id": {
          "type": "number"
        }
      },
      "required": [
        "name",
        "member_type",
        "status",
        "iban",
        "home_address",
        "billing_address",
        "first_name",
        "NRN",
        "email",
        "social_rate",
        "vat_number"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "invitation_id",
    "member"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» invitation_id|object|false|none|none|
|»» type|string|false|none|none|
|» member|[CreateMemberDTO](#schemacreatememberdto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_DocumentQueryDTO">DocumentQueryDTO</h2>
<!-- backwards compatibility -->
<a id="schemadocumentquerydto"></a>
<a id="schema_DocumentQueryDTO"></a>
<a id="tocSdocumentquerydto"></a>
<a id="tocsdocumentquerydto"></a>

```json
{
  "type": "object",
  "properties": {
    "page": {
      "type": "number"
    },
    "limit": {
      "type": "number"
    },
    "file_name": {
      "type": "string"
    },
    "file_type": {
      "type": "string"
    },
    "sort_upload_date": {
      "type": "string",
      "enum": [
        "ASC",
        "DESC"
      ]
    },
    "sort_file_size": {
      "type": "string",
      "enum": [
        "ASC",
        "DESC"
      ]
    }
  },
  "additionalProperties": false,
  "required": [
    "limit",
    "page"
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» page|object|false|none|none|
|»» type|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|» file_name|object|false|none|none|
|»» type|string|false|none|none|
|» file_type|object|false|none|none|
|»» type|string|false|none|none|
|» sort_upload_date|[Sort](#schemasort)|false|none|none|
|» sort_file_size|[Sort](#schemasort)|false|none|none|
|additionalProperties|boolean|false|none|none|
|required|[string]|false|none|none|

<h2 id="tocS_UploadDocumentDTO">UploadDocumentDTO</h2>
<!-- backwards compatibility -->
<a id="schemauploaddocumentdto"></a>
<a id="schema_UploadDocumentDTO"></a>
<a id="tocSuploaddocumentdto"></a>
<a id="tocsuploaddocumentdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id_member": {
      "type": "number"
    },
    "file": {
      "type": "object",
      "properties": {
        "fieldname": {
          "type": "string"
        },
        "originalname": {
          "type": "string"
        },
        "encoding": {
          "type": "string"
        },
        "mimetype": {
          "type": "string"
        },
        "size": {
          "type": "number"
        },
        "stream": {
          "type": "object",
          "properties": {
            "readable": {
              "type": "boolean"
            },
            "readableAborted": {
              "type": "boolean"
            },
            "readableDidRead": {
              "type": "boolean"
            },
            "readableEncoding": {
              "anyOf": [
                {
                  "type": "null"
                }
              ]
            },
            "readableEnded": {
              "type": "boolean"
            },
            "readableFlowing": {
              "type": [
                "boolean",
                "null"
              ]
            },
            "readableHighWaterMark": {
              "type": "number"
            },
            "readableLength": {
              "type": "number"
            },
            "readableObjectMode": {
              "type": "boolean"
            },
            "destroyed": {
              "type": "boolean"
            },
            "closed": {
              "type": "boolean"
            },
            "errored": {
              "anyOf": [
                {
                  "type": "null"
                }
              ]
            }
          },
          "required": [
            "closed",
            "destroyed",
            "errored",
            "readable",
            "readableAborted",
            "readableDidRead",
            "readableEncoding",
            "readableEnded",
            "readableFlowing",
            "readableHighWaterMark",
            "readableLength",
            "readableObjectMode"
          ],
          "additionalProperties": false
        },
        "destination": {
          "type": "string"
        },
        "filename": {
          "type": "string"
        },
        "path": {
          "type": "string"
        },
        "buffer": {
          "type": "object",
          "additionalProperties": {
            "type": "number"
          },
          "properties": {
            "BYTES_PER_ELEMENT": {
              "type": "number"
            },
            "buffer": {
              "type": "object",
              "properties": {
                "byteLength": {
                  "type": "number"
                }
              },
              "required": [
                "byteLength"
              ],
              "additionalProperties": false
            },
            "byteLength": {
              "type": "number"
            },
            "byteOffset": {
              "type": "number"
            },
            "length": {
              "type": "number"
            }
          },
          "required": [
            "BYTES_PER_ELEMENT",
            "buffer",
            "byteLength",
            "byteOffset",
            "length"
          ]
        }
      },
      "required": [
        "fieldname",
        "originalname",
        "encoding",
        "mimetype",
        "size",
        "stream",
        "destination",
        "filename",
        "path",
        "buffer"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "id_member",
    "file"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id_member|object|false|none|none|
|»» type|string|false|none|none|
|» file|[global.Express.Multer.File](#schemaglobal.express.multer.file)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_DownloadDocument">DownloadDocument</h2>
<!-- backwards compatibility -->
<a id="schemadownloaddocument"></a>
<a id="schema_DownloadDocument"></a>
<a id="tocSdownloaddocument"></a>
<a id="tocsdownloaddocument"></a>

```json
{
  "type": "object",
  "properties": {
    "document": {
      "type": "object",
      "additionalProperties": {
        "type": "number"
      },
      "properties": {
        "BYTES_PER_ELEMENT": {
          "type": "number"
        },
        "buffer": {
          "type": "object",
          "properties": {
            "byteLength": {
              "type": "number"
            }
          },
          "required": [
            "byteLength"
          ],
          "additionalProperties": false
        },
        "byteLength": {
          "type": "number"
        },
        "byteOffset": {
          "type": "number"
        },
        "length": {
          "type": "number"
        }
      },
      "required": [
        "BYTES_PER_ELEMENT",
        "buffer",
        "byteLength",
        "byteOffset",
        "length"
      ]
    },
    "fileName": {
      "type": "string"
    },
    "fileType": {
      "type": "string"
    }
  },
  "required": [
    "document",
    "fileName",
    "fileType"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» document|[global.Buffer](#schemaglobal.buffer)|false|none|none|
|» fileName|object|false|none|none|
|»» type|string|false|none|none|
|» fileType|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_DocumentExposedDTO">DocumentExposedDTO</h2>
<!-- backwards compatibility -->
<a id="schemadocumentexposeddto"></a>
<a id="schema_DocumentExposedDTO"></a>
<a id="tocSdocumentexposeddto"></a>
<a id="tocsdocumentexposeddto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "file_name": {
      "type": "string"
    },
    "file_size": {
      "type": "number"
    },
    "upload_date": {
      "type": "string",
      "format": "date-time"
    },
    "file_type": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "file_name",
    "file_size",
    "upload_date",
    "file_type"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» file_name|object|false|none|none|
|»» type|string|false|none|none|
|» file_size|object|false|none|none|
|»» type|string|false|none|none|
|» upload_date|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|» file_type|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_DocumentDTO">DocumentDTO</h2>
<!-- backwards compatibility -->
<a id="schemadocumentdto"></a>
<a id="schema_DocumentDTO"></a>
<a id="tocSdocumentdto"></a>
<a id="tocsdocumentdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "file_name": {
      "type": "string"
    },
    "file_size": {
      "type": "number"
    },
    "upload_date": {
      "type": "string",
      "format": "date-time"
    },
    "file_type": {
      "type": "string"
    },
    "member_id": {
      "type": "number"
    },
    "file_url": {
      "type": "string"
    }
  },
  "required": [
    "file_name",
    "file_size",
    "file_type",
    "file_url",
    "id",
    "member_id",
    "upload_date"
  ],
  "additionalProperties": false
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|» file_name|object|false|none|none|
|»» type|string|false|none|none|
|» file_size|object|false|none|none|
|»» type|string|false|none|none|
|» upload_date|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|» file_type|object|false|none|none|
|»» type|string|false|none|none|
|» member_id|object|false|none|none|
|»» type|string|false|none|none|
|» file_url|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

