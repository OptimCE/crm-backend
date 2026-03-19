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
{
  "error_code": 0,
  "data": [
    {
      "id": 1,
      "auth_community_id": "auth0|123456",
      "name": "Résidence Les Lilas",
      "role": "admin"
    },
    {
      "id": 2,
      "auth_community_id": "auth0|789012",
      "name": "Immeuble Central",
      "role": "member"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "error_code": 0,
  "data": [
    {
      "id_user": 101,
      "id_community": 1,
      "email": "jane.doe@example.com",
      "role": "gestionnaire"
    },
    {
      "id_user": 102,
      "id_community": 1,
      "email": "bob.smith@example.com",
      "role": "member"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="get-users-of-a-community-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful list of community users|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-users-of-a-community-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "error_code": 0,
  "data": [
    {
      "id_user": 101,
      "id_community": 1,
      "email": "jane.doe@example.com",
      "role": "gestionnaire"
    },
    {
      "id_user": 105,
      "id_community": 1,
      "email": "admin.user@example.com",
      "role": "admin"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
      "type": "string",
      "description": "The name of the community. Must be a non-empty string."
    }
  },
  "required": [
    "name"
  ],
  "additionalProperties": false,
  "description": "DTO for creating or updating a community."
}
```

<h3 id="create-a-new-community-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CreateCommunityDTO](#schemacreatecommunitydto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
      "type": "string",
      "description": "The name of the community. Must be a non-empty string."
    }
  },
  "required": [
    "name"
  ],
  "additionalProperties": false,
  "description": "DTO for creating or updating a community."
}
```

<h3 id="update-a-community-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CreateCommunityDTO](#schemacreatecommunitydto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Patch the role of a user

> Code samples

`PATCH /communities/`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id_user": {
      "type": "number",
      "description": "The ID of the user whose role is being updated. Must be an integer."
    },
    "new_role": {
      "type": "string",
      "enum": [
        "MEMBER",
        "MANAGER",
        "ADMIN"
      ],
      "description": "Enum representing user roles in the system with increasing privilege levels"
    }
  },
  "required": [
    "id_user",
    "new_role"
  ],
  "additionalProperties": false,
  "description": "DTO for patching (updating) a user's role within a community."
}
```

<h3 id="patch-the-role-of-a-user-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[PatchRoleUserDTO](#schemapatchroleuserdto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "error_code": 0,
  "data": [
    {
      "id": 10,
      "file_name": "contrat_location.pdf",
      "file_size": 102400,
      "upload_date": "2023-10-27T10:00:00Z",
      "file_type": "application/pdf"
    },
    {
      "id": 11,
      "file_name": "facture_electricite.png",
      "file_size": 204800,
      "upload_date": "2023-11-01T14:30:00Z",
      "file_type": "image/png"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "error_code": 0,
  "data": [
    {
      "id": 5,
      "member_id": 42,
      "member_name": "Jean Dupont",
      "user_email": "jean.dupont@example.com",
      "created_at": "2024-03-01T08:00:00.000Z",
      "to_be_encoded": false,
      "community": {
        "id": 1,
        "name": "Coopérative Energie"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 15,
    "total": 1
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="get-all-member-pending-invitations-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful list of pending member invitations for the authenticated user|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-all-member-pending-invitations-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "error_code": 0,
  "data": [
    {
      "id": 3,
      "user_email": "manager@example.com",
      "created_at": "2024-03-10T09:00:00.000Z",
      "community": {
        "id": 1,
        "name": "Coopérative Energie"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 15,
    "total": 1
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="get-all-managers-pending-invitations-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful list of pending manager invitations for the authenticated user|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-all-managers-pending-invitations-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
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
      "type": "string",
      "description": "Email of the user to invite."
    }
  },
  "required": [
    "user_email"
  ],
  "additionalProperties": false,
  "description": "DTO for sending an invitation."
}
```

<h3 id="invite-a-user-to-become-a-member-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[InviteUser](#schemainviteuser)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="invite-a-user-to-become-a-member-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Invitation action completed successfully|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="invite-a-user-to-become-a-member-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
      "type": "string",
      "description": "Email of the user to invite."
    }
  },
  "required": [
    "user_email"
  ],
  "additionalProperties": false,
  "description": "DTO for sending an invitation."
}
```

<h3 id="invite-a-user-to-become-a-manager-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[InviteUser](#schemainviteuser)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="invite-a-user-to-become-a-manager-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Invitation action completed successfully|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="invite-a-user-to-become-a-manager-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
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
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="cancel-a-member-invitation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Invitation action completed successfully|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="cancel-a-member-invitation-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="cancel-a-manager-invitation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Invitation action completed successfully|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="cancel-a-manager-invitation-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
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
{
  "error_code": 0,
  "data": [
    {
      "id": 10,
      "name": "Clef de répartition 2023",
      "description": "Répartition pour l'année 2023"
    },
    {
      "id": 11,
      "name": "Clef par défaut",
      "description": "Répartition standard"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
      "type": "string",
      "description": "Name of the key."
    },
    "description": {
      "type": "string",
      "description": "Description of the key."
    },
    "iterations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "number": {
            "type": "number",
            "description": "Iteration number (0, 1, or 2)."
          },
          "energy_allocated_percentage": {
            "type": "number",
            "description": "Total energy percentage for this iteration."
          },
          "consumers": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string",
                  "description": "Name of the consumer."
                },
                "energy_allocated_percentage": {
                  "type": "number",
                  "description": "Energy allocated. Range: -1 (PRORATA) to 1 (100%)."
                }
              },
              "required": [
                "name",
                "energy_allocated_percentage"
              ],
              "additionalProperties": false,
              "description": "DTO for creating a new consumer."
            },
            "description": "List of consumers. Must adhere to sum constraints."
          }
        },
        "required": [
          "number",
          "energy_allocated_percentage",
          "consumers"
        ],
        "additionalProperties": false,
        "description": "DTO for creating a new iteration."
      },
      "description": "Iterations for the key. Must sum up correctly."
    }
  },
  "required": [
    "name",
    "description",
    "iterations"
  ],
  "additionalProperties": false,
  "description": "DTO for creating a new key."
}
```

<h3 id="add-a-key-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CreateKeyDTO](#schemacreatekeydto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
      "type": "number",
      "description": "ID of the key to update."
    },
    "name": {
      "type": "string",
      "description": "New name."
    },
    "description": {
      "type": "string",
      "description": "New description."
    },
    "iterations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "number": {
            "type": "number",
            "description": "Iteration number (0, 1, or 2)."
          },
          "energy_allocated_percentage": {
            "type": "number",
            "description": "Total energy percentage for this iteration."
          },
          "consumers": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string",
                  "description": "Name of the consumer."
                },
                "energy_allocated_percentage": {
                  "type": "number",
                  "description": "Energy allocated. Range: -1 (PRORATA) to 1 (100%)."
                }
              },
              "required": [
                "name",
                "energy_allocated_percentage"
              ],
              "additionalProperties": false,
              "description": "DTO for creating a new consumer."
            },
            "description": "List of consumers. Must adhere to sum constraints."
          }
        },
        "required": [
          "number",
          "energy_allocated_percentage",
          "consumers"
        ],
        "additionalProperties": false,
        "description": "DTO for creating a new iteration."
      },
      "description": "New iterations configuration."
    }
  },
  "required": [
    "id",
    "name",
    "description",
    "iterations"
  ],
  "additionalProperties": false,
  "description": "DTO for updating an existing key."
}
```

<h3 id="update-a-key-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[UpdateKeyDTO](#schemaupdatekeydto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "error_code": 0,
  "data": {
    "id": 10,
    "name": "Clef de répartition 2023",
    "description": "Répartition pour l'année 2023",
    "iterations": [
      {
        "id": 100,
        "number": 0,
        "energy_allocated_percentage": 1,
        "consumers": [
          {
            "id": 1001,
            "name": "Appartement 1",
            "energy_allocated_percentage": 0.5
          },
          {
            "id": 1002,
            "name": "Appartement 2",
            "energy_allocated_percentage": 0.5
          }
        ]
      }
    ]
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="get-download-a-detailled-key-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful key download|string|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-download-a-detailled-key-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

### Response Headers

|Status|Header|Type|Format|Description|
|---|---|---|---|---|
|200|Content-Disposition|string||Attachment filename|

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
{
  "error_code": 0,
  "data": [
    {
      "id": 42,
      "name": "Jean Dupont",
      "member_type": 1,
      "status": 1
    },
    {
      "id": 43,
      "name": "SPRL Immobilière",
      "member_type": 2,
      "status": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 15,
    "total": 2
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
      "type": "string",
      "description": "Name of the member (Full name or Company name)."
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
      "type": "string",
      "description": "IBAN of the member."
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
      "additionalProperties": false,
      "description": "DTO for creating a new address."
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
      "additionalProperties": false,
      "description": "DTO for creating a new address."
    },
    "first_name": {
      "type": "string",
      "description": "First name (Individual only)."
    },
    "NRN": {
      "type": "string",
      "description": "National Registry Number (Individual only)."
    },
    "email": {
      "type": "string",
      "description": "Contact email (Individual only)."
    },
    "phone_number": {
      "type": "string",
      "description": "Phone number (Individual only)."
    },
    "social_rate": {
      "type": "boolean",
      "description": "Social rate eligibility (Individual only)."
    },
    "vat_number": {
      "type": "string",
      "description": "VAT number (Company only)."
    },
    "manager": {
      "type": "object",
      "properties": {
        "NRN": {
          "type": "string",
          "description": "National Registry Number of the manager."
        },
        "name": {
          "type": "string",
          "description": "First name of the manager."
        },
        "surname": {
          "type": "string",
          "description": "Surname of the manager."
        },
        "email": {
          "type": "string",
          "description": "Email address of the manager."
        },
        "phone_number": {
          "type": "string",
          "description": "Phone number of the manager."
        }
      },
      "required": [
        "NRN",
        "name",
        "surname",
        "email"
      ],
      "additionalProperties": false,
      "description": "DTO representing a manager associated with a member."
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
  "additionalProperties": false,
  "description": "DTO for creating a new member. Contains common fields and type-specific fields (Individual vs Company). Uses conditional validation based on `member_type`."
}
```

<h3 id="create-a-new-member-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CreateMemberDTO](#schemacreatememberdto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
      "type": "number",
      "description": "ID of the member to update."
    },
    "name": {
      "type": "string",
      "description": "New name."
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
      "type": "string",
      "description": "New IBAN."
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
      "additionalProperties": false,
      "description": "DTO for updating an existing address. All fields are optional."
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
      "additionalProperties": false,
      "description": "DTO for updating an existing address. All fields are optional."
    },
    "first_name": {
      "type": "string",
      "description": "Update first name."
    },
    "NRN": {
      "type": "string",
      "description": "Update NRN."
    },
    "email": {
      "type": "string",
      "description": "Update email."
    },
    "phone_number": {
      "type": "string",
      "description": "Update phone number."
    },
    "social_rate": {
      "type": "boolean",
      "description": "Update social rate."
    },
    "vat_number": {
      "type": "string",
      "description": "Update VAT number."
    },
    "manager": {
      "type": "object",
      "properties": {
        "NRN": {
          "type": "string",
          "description": "National Registry Number of the manager."
        },
        "name": {
          "type": "string",
          "description": "First name of the manager."
        },
        "surname": {
          "type": "string",
          "description": "Surname of the manager."
        },
        "email": {
          "type": "string",
          "description": "Email address of the manager."
        },
        "phone_number": {
          "type": "string",
          "description": "Phone number of the manager."
        }
      },
      "required": [
        "NRN",
        "name",
        "surname",
        "email"
      ],
      "additionalProperties": false,
      "description": "DTO representing a manager associated with a member."
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false,
  "description": "DTO for updating an existing member. Most fields are optional to allow partial updates."
}
```

<h3 id="update-a-member-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[UpdateMemberDTO](#schemaupdatememberdto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "error_code": 0,
  "data": {
    "id": 42,
    "name": "Jean Dupont",
    "member_type": 1,
    "status": 1,
    "iban": "BE12345678901234",
    "NRN": "80010112345",
    "first_name": "Jean",
    "email": "jean.dupont@example.com",
    "phone_number": "+32470123456",
    "social_rate": false,
    "home_address": {
      "street": "Rue de la Gare",
      "number": "10",
      "box": "A",
      "city": "Brussels",
      "zip_code": "1000",
      "country": "Belgium"
    },
    "billing_address": {
      "street": "Rue de la Gare",
      "number": "10",
      "box": "A",
      "city": "Brussels",
      "zip_code": "1000",
      "country": "Belgium"
    }
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "error_code": 0,
  "data": {
    "user_email": "jean.dupont@example.com",
    "user_id": 101,
    "status": 1
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
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
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
      "type": "number",
      "description": "ID of the member."
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
  "additionalProperties": false,
  "description": "DTO for patching member status only."
}
```

<h3 id="update-a-member-status-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[PatchMemberStatusDTO](#schemapatchmemberstatusdto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
      "type": "number",
      "description": "ID of the member."
    },
    "user_email": {
      "type": "string",
      "description": "Email of the user to invite."
    }
  },
  "required": [
    "id_member",
    "user_email"
  ],
  "additionalProperties": false,
  "description": "DTO for inviting a user to link to a member account."
}
```

<h3 id="invite-an-user-to-create-a-link-with-this-member-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[PatchMemberInviteUserDTO](#schemapatchmemberinviteuserdto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "error_code": 0,
  "data": [
    {
      "EAN": "541448800000000000",
      "meter_number": "12345678",
      "status": 1,
      "address": {
        "street": "Rue de la Gare",
        "number": "10",
        "city": "Bruxelles",
        "zip_code": "1000",
        "country": "Belgium"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
      "type": "string",
      "description": "EAN Code (Unique Identifier)."
    },
    "meter_number": {
      "type": "string",
      "description": "Physical Meter Number."
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
      "additionalProperties": false,
      "description": "DTO for creating a new address."
    },
    "tarif_group": {
      "type": "number",
      "enum": [
        1,
        2
      ]
    },
    "phases_number": {
      "type": "number",
      "description": "Number of phases (min 1)."
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
          "format": "date-time",
          "description": "Start date of validity for this configuration."
        },
        "end_date": {
          "type": "string",
          "format": "date-time",
          "description": "End date of validity (optional)."
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
          "type": "string",
          "description": "Description or label."
        },
        "sampling_power": {
          "type": "number",
          "description": "Sampling power."
        },
        "amperage": {
          "type": "number",
          "description": "Amperage."
        },
        "grd": {
          "type": "string",
          "description": "GRD (DSO) identifier."
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
          "type": "number",
          "description": "Total generating capacity."
        },
        "member_id": {
          "type": "number",
          "description": "ID of the associated member (holder)."
        },
        "sharing_operation_id": {
          "type": "number",
          "description": "ID of the associated sharing operation."
        }
      },
      "required": [
        "start_date",
        "status",
        "rate",
        "client_type"
      ],
      "additionalProperties": false,
      "description": "DTO for creating or updating a MeterData configuration period."
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
  "additionalProperties": false,
  "description": "DTO for creating a new physical meter and its initial configuration."
}
```

<h3 id="add-a-new-meter-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CreateMeterDTO](#schemacreatemeterdto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Update a meter

> Code samples

`PUT /meters/`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "EAN": {
      "type": "string",
      "description": "EAN Code (Unique Identifier)."
    },
    "meter_number": {
      "type": "string",
      "description": "Physical Meter Number."
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
      "additionalProperties": false,
      "description": "DTO for creating a new address."
    },
    "tarif_group": {
      "type": "number",
      "enum": [
        1,
        2
      ]
    },
    "phases_number": {
      "type": "number",
      "description": "Number of phases (min 1)."
    },
    "reading_frequency": {
      "type": "number",
      "enum": [
        1,
        2
      ]
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

<h3 id="update-a-meter-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[UpdateMeterDTO](#schemaupdatemeterdto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="update-a-meter-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Meter successfully added|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="update-a-meter-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "error_code": 0,
  "data": {
    "EAN": "541448800000000000",
    "meter_number": "12345678",
    "phases_number": 3,
    "reading_frequency": 1,
    "tarif_group": 0,
    "address": {
      "street": "Rue de la Gare",
      "number": "10",
      "city": "Bruxelles",
      "zip_code": "1000",
      "country": "Belgium"
    },
    "meter_data": {
      "id": 1,
      "description": "Compteur principal",
      "status": 1,
      "client_type": 1,
      "rate": 1,
      "start_date": "2023-01-01T00:00:00Z"
    }
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "error_code": 0,
  "data": {
    "EAN": "541448800000000000",
    "timestamps": [
      "2023-01-01T00:00:00Z",
      "2023-01-01T00:15:00Z"
    ],
    "gross": [
      0.5,
      0.6
    ],
    "net": [
      0.5,
      0.6
    ],
    "shared": [
      0,
      0
    ],
    "inj_gross": [
      0,
      0
    ],
    "inj_net": [
      0,
      0
    ],
    "inj_shared": [
      0,
      0
    ]
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
      "format": "date-time",
      "description": "Start date of validity for this configuration."
    },
    "end_date": {
      "type": "string",
      "format": "date-time",
      "description": "End date of validity (optional)."
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
      "type": "string",
      "description": "Description or label."
    },
    "sampling_power": {
      "type": "number",
      "description": "Sampling power."
    },
    "amperage": {
      "type": "number",
      "description": "Amperage."
    },
    "grd": {
      "type": "string",
      "description": "GRD (DSO) identifier."
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
      "type": "number",
      "description": "Total generating capacity."
    },
    "member_id": {
      "type": "number",
      "description": "ID of the associated member (holder)."
    },
    "sharing_operation_id": {
      "type": "number",
      "description": "ID of the associated sharing operation."
    },
    "EAN": {
      "type": "string",
      "description": "EAN Code of the meter to update."
    }
  },
  "required": [
    "EAN",
    "client_type",
    "rate",
    "start_date",
    "status"
  ],
  "additionalProperties": false,
  "description": "DTO for patching meter data configuration. Requires EAN to identify the meter to update."
}
```

<h3 id="patch-meter-data-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[PatchMeterDataDTO](#schemapatchmeterdatadto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Delete a future meter data

> Code samples

`PATCH /meters/data/delete`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "id_meter_data": {
      "type": "number",
      "description": "ID meter data to delete"
    },
    "active_previous_meter_data": {
      "type": "boolean",
      "description": "If true, take the previous meter data and reactive it"
    }
  },
  "required": [
    "id_meter_data"
  ],
  "additionalProperties": false,
  "description": "DTO for deleting future meter data Require ID Meter data to identify the entry to remove"
}
```

<h3 id="delete-a-future-meter-data-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[DeleteFutureMeterDataDTO](#schemadeletefuturemeterdatadto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="delete-a-future-meter-data-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Meter successfully deleted|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="delete-a-future-meter-data-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "error_code": 0,
  "data": [
    {
      "id": 1,
      "name": "Partage Résidence",
      "type": 1
    },
    {
      "id": 2,
      "name": "Partage Local",
      "type": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
  "additionalProperties": false,
  "description": "DTO for creating a new sharing operation."
}
```

<h3 id="create-a-new-sharing-operation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CreateSharingOperationDTO](#schemacreatesharingoperationdto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "error_code": 0,
  "data": {
    "id": 1,
    "name": "Partage Résidence",
    "type": 1,
    "key": {
      "id": 10,
      "key": {
        "id": 5,
        "name": "Clé Principale"
      },
      "start_date": "2023-01-01T00:00:00Z",
      "end_date": "2023-12-31T23:59:59Z",
      "status": 1
    },
    "history_keys": [],
    "key_waiting_approval": null
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Get paginated meters list of meters in the sharing operation (past, now or future)

> Code samples

`GET /sharing_operations/{id}/meters`

<h3 id="get-paginated-meters-list-of-meters-in-the-sharing-operation-(past,-now-or-future)-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|undefined|true|none|
|filters|query|[SharingOperationConsumptionQuery](#schemasharingoperationconsumptionquery)|false|Date range filters for sharing operation consumptions|

> Example responses

> 200 Response

```json
{
  "error_code": 0,
  "data": {
    "id": 1,
    "timestamps": [
      "2023-01-01T00:00:00Z",
      "2023-01-01T00:15:00Z"
    ],
    "gross": [
      10.5,
      11.2
    ],
    "net": [
      10.5,
      11.2
    ],
    "shared": [
      5,
      5.5
    ],
    "inj_gross": [
      2,
      2.1
    ],
    "inj_net": [
      1.8,
      1.9
    ],
    "inj_shared": [
      1,
      1
    ]
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="get-paginated-meters-list-of-meters-in-the-sharing-operation-(past,-now-or-future)-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful sharing operation consumptions retrieval|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-paginated-meters-list-of-meters-in-the-sharing-operation-(past,-now-or-future)-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker & CommunityIdChecker & MinRoleChecker
</aside>

## Get paginated historical keys list

> Code samples

`GET /sharing_operations/{id}/keys`

<h3 id="get-paginated-historical-keys-list-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|undefined|true|none|
|filters|query|[SharingOperationConsumptionQuery](#schemasharingoperationconsumptionquery)|false|Date range filters for sharing operation consumptions|

> Example responses

> 200 Response

```json
{
  "error_code": 0,
  "data": {
    "id": 1,
    "timestamps": [
      "2023-01-01T00:00:00Z",
      "2023-01-01T00:15:00Z"
    ],
    "gross": [
      10.5,
      11.2
    ],
    "net": [
      10.5,
      11.2
    ],
    "shared": [
      5,
      5.5
    ],
    "inj_gross": [
      2,
      2.1
    ],
    "inj_net": [
      1.8,
      1.9
    ],
    "inj_shared": [
      1,
      1
    ]
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="get-paginated-historical-keys-list-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful sharing operation consumptions retrieval|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-paginated-historical-keys-list-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "error_code": 0,
  "data": {
    "id": 1,
    "timestamps": [
      "2023-01-01T00:00:00Z",
      "2023-01-01T00:15:00Z"
    ],
    "gross": [
      10.5,
      11.2
    ],
    "net": [
      10.5,
      11.2
    ],
    "shared": [
      5,
      5.5
    ],
    "inj_gross": [
      2,
      2.1
    ],
    "inj_net": [
      1.8,
      1.9
    ],
    "inj_shared": [
      1,
      1
    ]
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
  "additionalProperties": false,
  "description": "DTO for associating a key with a sharing operation."
}
```

<h3 id="add-a-new-key-to-the-sharing-operation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[AddKeyToSharingOperationDTO](#schemaaddkeytosharingoperationdto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
  "additionalProperties": false,
  "description": "DTO for updating the status of a key in a sharing operation."
}
```

<h3 id="change-the-status-of-a-key-in-the-sharing-operation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[PatchKeyToSharingOperationDTO](#schemapatchkeytosharingoperationdto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
  "additionalProperties": false,
  "description": "DTO for adding meters to a sharing operation."
}
```

<h3 id="add-a-new-meter-to-the-sharing-operation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[AddMeterToSharingOperationDTO](#schemaaddmetertosharingoperationdto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
  "additionalProperties": false,
  "description": "DTO for updating the status of a meter within a sharing operation."
}
```

<h3 id="change-the-status-of-a-meter-in-the-sharing-operation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[PatchMeterToSharingOperationDTO](#schemapatchmetertosharingoperationdto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
  "additionalProperties": false,
  "description": "DTO for removing a meter from a sharing operation."
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
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
{
  "error_code": 0,
  "data": {
    "id": 42,
    "first_name": "Jean",
    "last_name": "Dupont",
    "nrn": "80010112345",
    "phone_number": "+32470123456",
    "email": "jean.dupont@example.com",
    "iban": "BE12345678901234",
    "home_address": {
      "street": "Rue de la Gare",
      "number": "10",
      "box": "A",
      "city": "Brussels",
      "zip_code": "1000",
      "country": "Belgium"
    },
    "billing_address": {
      "street": "Rue de la Gare",
      "number": "10",
      "box": "A",
      "city": "Brussels",
      "zip_code": "1000",
      "country": "Belgium"
    }
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
      "additionalProperties": false,
      "description": "DTO for creating a new address."
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
      "additionalProperties": false,
      "description": "DTO for creating a new address."
    }
  },
  "additionalProperties": false,
  "description": "DTO for updating user information. All fields are optional; only provided fields will be updated."
}
```

<h3 id="update-the-user-profile-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[UpdateUserDTO](#schemaupdateuserdto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
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
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

<h1 id="optimce-crm-backend-api-documentation-me">Me</h1>

## Retrieve all documents related to this user

> Code samples

`GET /me/documents`

Retrieve documents with optional filters defined in MeDocumentPartialQuery.

<h3 id="retrieve-all-documents-related-to-this-user-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|filters|query|[MeDocumentPartialQuery](#schemamedocumentpartialquery)|false|Pagination and filter options for documents|

> Example responses

> 200 Response

```json
{
  "error_code": 0,
  "data": [
    {
      "id": 7,
      "file_name": "invoice_2024.pdf",
      "file_size": 204800,
      "upload_date": "2024-03-15T10:30:00.000Z",
      "file_type": "application/pdf",
      "community": {
        "id": 1,
        "name": "Coopérative Energie"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 15,
    "total": 1
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="retrieve-all-documents-related-to-this-user-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful list of documents for the authenticated user|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="retrieve-all-documents-related-to-this-user-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

## Download a document by ID

> Code samples

`GET /me/documents/{id}`

<h3 id="download-a-document-by-id-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|integer|true|ID of the document|

> Example responses

> 200 Response

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="download-a-document-by-id-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Document file binary content|string|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="download-a-document-by-id-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

## Retrieve all members represented by this user

> Code samples

`GET /me/members`

Retrieve members with optional filters defined in MeMemberPartialQuery.

<h3 id="retrieve-all-members-represented-by-this-user-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|filters|query|[MeMemberPartialQuery](#schemamememberpartialquery)|false|Pagination and filter options for members|

> Example responses

> 200 Response

```json
{
  "error_code": 0,
  "data": [
    {
      "id": 42,
      "name": "Jean Dupont",
      "member_type": 1,
      "status": 1,
      "community": {
        "id": 1,
        "name": "Coopérative Energie"
      }
    },
    {
      "id": 43,
      "name": "SPRL Immobilière",
      "member_type": 2,
      "status": 1,
      "community": {
        "id": 2,
        "name": "Solar Community"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 15,
    "total": 2
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="retrieve-all-members-represented-by-this-user-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful list of members represented by the authenticated user|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="retrieve-all-members-represented-by-this-user-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

## Retrieve a specific member by ID

> Code samples

`GET /me/members/{id}`

<h3 id="retrieve-a-specific-member-by-id-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|integer|true|ID of the member|

> Example responses

> 200 Response

```json
{
  "error_code": 0,
  "data": {
    "id": 42,
    "name": "Jean Dupont",
    "member_type": 1,
    "status": 1,
    "iban": "BE12345678901234",
    "NRN": "80010112345",
    "first_name": "Jean",
    "email": "jean.dupont@example.com",
    "phone_number": "+32470123456",
    "social_rate": false,
    "home_address": {
      "street": "Rue de la Gare",
      "number": "10",
      "box": "A",
      "city": "Brussels",
      "zip_code": "1000",
      "country": "Belgium"
    },
    "billing_address": {
      "street": "Rue de la Gare",
      "number": "10",
      "box": "A",
      "city": "Brussels",
      "zip_code": "1000",
      "country": "Belgium"
    },
    "community": {
      "id": 1,
      "name": "Coopérative Energie"
    }
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="retrieve-a-specific-member-by-id-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful member details for the authenticated user|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="retrieve-a-specific-member-by-id-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

## Retrieve all meters owned by this user

> Code samples

`GET /me/meters`

Retrieve meters with optional filters defined in MeMetersPartialQuery.

<h3 id="retrieve-all-meters-owned-by-this-user-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|filters|query|[MeMetersPartialQuery](#schemamemeterspartialquery)|false|Pagination and filter options for meters|

> Example responses

> 200 Response

```json
{
  "error_code": 0,
  "data": [
    {
      "EAN": "541448820000000001",
      "meter_number": "MTR-001",
      "address": {
        "street": "Rue de la Gare",
        "number": "10",
        "box": null,
        "city": "Brussels",
        "zip_code": "1000",
        "country": "Belgium"
      },
      "holder": {
        "id": 42,
        "name": "Jean Dupont",
        "member_type": 1,
        "status": 1
      },
      "status": 1,
      "community": {
        "id": 1,
        "name": "Coopérative Energie"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 15,
    "total": 1
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="retrieve-all-meters-owned-by-this-user-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful list of meters owned by the authenticated user|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="retrieve-all-meters-owned-by-this-user-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

## Retrieve a specific meter by EAN

> Code samples

`GET /me/meters/{id}`

<h3 id="retrieve-a-specific-meter-by-ean-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|EAN code of the meter|

> Example responses

> 200 Response

```json
{
  "error_code": 0,
  "data": {
    "EAN": "541448820000000001",
    "meter_number": "MTR-001",
    "address": {
      "street": "Rue de la Gare",
      "number": "10",
      "box": null,
      "city": "Brussels",
      "zip_code": "1000",
      "country": "Belgium"
    },
    "holder": {
      "id": 42,
      "name": "Jean Dupont",
      "member_type": 1,
      "status": 1
    },
    "tarif_group": 1,
    "phases_number": 3,
    "reading_frequency": 1,
    "meter_data": {
      "id": 10,
      "description": "Standard residential",
      "sampling_power": 0,
      "status": 1,
      "amperage": 25,
      "rate": 1,
      "client_type": 1,
      "start_date": "2023-01-01T00:00:00.000Z",
      "end_date": null,
      "injection_status": 0,
      "production_chain": 0,
      "totalGenerating_capacity": 0,
      "grd": "Sibelga"
    },
    "meter_data_history": [],
    "futur_meter_data": [],
    "community": {
      "id": 1,
      "name": "Coopérative Energie"
    }
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="retrieve-a-specific-meter-by-ean-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful meter detail for the authenticated user|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="retrieve-a-specific-meter-by-ean-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

## Get all own member pending invitations

> Code samples

`GET /me/invitations`

<h3 id="get-all-own-member-pending-invitations-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|filters|query|[UserMemberInvitationQuery](#schemausermemberinvitationquery)|false|Pagination and filter options for member invitations|

> Example responses

> 200 Response

```json
{
  "error_code": 0,
  "data": [
    {
      "id": 5,
      "member_id": 42,
      "member_name": "Jean Dupont",
      "user_email": "jean.dupont@example.com",
      "created_at": "2024-03-01T08:00:00.000Z",
      "to_be_encoded": false,
      "community": {
        "id": 1,
        "name": "Coopérative Energie"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 15,
    "total": 1
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="get-all-own-member-pending-invitations-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful list of pending member invitations for the authenticated user|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-all-own-member-pending-invitations-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

## Get member linked to a pending invitation by ID

> Code samples

`GET /me/invitations/member/{id}`

<h3 id="get-member-linked-to-a-pending-invitation-by-id-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|integer|true|ID of the document|

> Example responses

> 200 Response

```json
{
  "error_code": 0,
  "data": {
    "id": 5,
    "member_id": 42,
    "member_name": "Jean Dupont",
    "user_email": "jean.dupont@example.com",
    "created_at": "2024-03-01T08:00:00.000Z",
    "to_be_encoded": false,
    "community": {
      "id": 1,
      "name": "Coopérative Energie"
    }
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="get-member-linked-to-a-pending-invitation-by-id-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful member invitation details linked to the authenticated user|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-member-linked-to-a-pending-invitation-by-id-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

## Get all own managers pending invitations

> Code samples

`GET /me/invitations/managers`

<h3 id="get-all-own-managers-pending-invitations-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|filters|query|[UserManagerInvitationQuery](#schemausermanagerinvitationquery)|false|Pagination and filter options for manager invitations|

> Example responses

> 200 Response

```json
{
  "error_code": 0,
  "data": [
    {
      "id": 3,
      "user_email": "manager@example.com",
      "created_at": "2024-03-10T09:00:00.000Z",
      "community": {
        "id": 1,
        "name": "Coopérative Energie"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 15,
    "total": 1
  }
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="get-all-own-managers-pending-invitations-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful list of pending manager invitations for the authenticated user|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="get-all-own-managers-pending-invitations-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

## Accept an invitation member

> Code samples

`POST /me/invitations/accept`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "invitation_id": {
      "type": "number",
      "description": "ID of the invitation to accept."
    }
  },
  "required": [
    "invitation_id"
  ],
  "additionalProperties": false,
  "description": "DTO for accepting an invitation."
}
```

<h3 id="accept-an-invitation-member-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[AcceptInvitationDTO](#schemaacceptinvitationdto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="accept-an-invitation-member-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Invitation action completed successfully|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="accept-an-invitation-member-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

## Accept an invitation with encoded member

> Code samples

`POST /me/invitations/accept/encoded`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "invitation_id": {
      "type": "number",
      "description": "ID of the invitation to accept."
    },
    "member": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Name of the member (Full name or Company name)."
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
          "type": "string",
          "description": "IBAN of the member."
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
          "additionalProperties": false,
          "description": "DTO for creating a new address."
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
          "additionalProperties": false,
          "description": "DTO for creating a new address."
        },
        "first_name": {
          "type": "string",
          "description": "First name (Individual only)."
        },
        "NRN": {
          "type": "string",
          "description": "National Registry Number (Individual only)."
        },
        "email": {
          "type": "string",
          "description": "Contact email (Individual only)."
        },
        "phone_number": {
          "type": "string",
          "description": "Phone number (Individual only)."
        },
        "social_rate": {
          "type": "boolean",
          "description": "Social rate eligibility (Individual only)."
        },
        "vat_number": {
          "type": "string",
          "description": "VAT number (Company only)."
        },
        "manager": {
          "type": "object",
          "properties": {
            "NRN": {
              "type": "string",
              "description": "National Registry Number of the manager."
            },
            "name": {
              "type": "string",
              "description": "First name of the manager."
            },
            "surname": {
              "type": "string",
              "description": "Surname of the manager."
            },
            "email": {
              "type": "string",
              "description": "Email address of the manager."
            },
            "phone_number": {
              "type": "string",
              "description": "Phone number of the manager."
            }
          },
          "required": [
            "NRN",
            "name",
            "surname",
            "email"
          ],
          "additionalProperties": false,
          "description": "DTO representing a manager associated with a member."
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
      "additionalProperties": false,
      "description": "DTO for creating a new member. Contains common fields and type-specific fields (Individual vs Company). Uses conditional validation based on `member_type`."
    }
  },
  "required": [
    "invitation_id",
    "member"
  ],
  "additionalProperties": false,
  "description": "DTO for accepting an invitation with additional member details. Used when the member needs to be encoded/created during acceptance."
}
```

<h3 id="accept-an-invitation-with-encoded-member-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[AcceptInvitationWEncodedDTO](#schemaacceptinvitationwencodeddto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="accept-an-invitation-with-encoded-member-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Invitation action completed successfully|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="accept-an-invitation-with-encoded-member-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

## Accept an invitation for manager

> Code samples

`POST /me/invitations/accept/manager`

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "invitation_id": {
      "type": "number",
      "description": "ID of the invitation to accept."
    }
  },
  "required": [
    "invitation_id"
  ],
  "additionalProperties": false,
  "description": "DTO for accepting an invitation."
}
```

<h3 id="accept-an-invitation-for-manager-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[AcceptInvitationDTO](#schemaacceptinvitationdto)|true|none|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="accept-an-invitation-for-manager-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Invitation action completed successfully|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="accept-an-invitation-for-manager-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

## Refuse a member own invitation

> Code samples

`DELETE /me/invitations/{id_invitation}/member`

<h3 id="refuse-a-member-own-invitation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id_invitation|path|integer|true|ID of the invitation|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="refuse-a-member-own-invitation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Invitation action completed successfully|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="refuse-a-member-own-invitation-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
UserIdChecker
</aside>

## Refuse a manager own invitation

> Code samples

`DELETE /me/invitations/{id_invitation}/manager`

<h3 id="refuse-a-manager-own-invitation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id_invitation|path|integer|true|ID of the invitation|

> Example responses

> 200 Response

```json
{
  "data": "success"
}
```

> 400 Response

```json
{
  "error": "UNAUTHENTICATED",
  "statusCode": 400
}
```

<h3 id="refuse-a-manager-own-invitation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Invitation action completed successfully|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request - Authentication or Community Context missing|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized - Role context missing|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden - Insufficient Role permissions|Inline|

<h3 id="refuse-a-manager-own-invitation-responseschema">Response Schema</h3>

Status Code **400**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **401**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» error|string|false|none|none|
|» statusCode|integer|false|none|none|

Status Code **403**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
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
      "type": "string",
      "description": "Public URL or internal path to the file"
    },
    "file_type": {
      "type": "string",
      "description": "MIME type of the file"
    }
  },
  "required": [
    "url",
    "file_type"
  ],
  "additionalProperties": false,
  "description": "DTO representing an uploaded document's metadata."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» url|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» file_type|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Page number to retrieve (1-based index). Defaults to 1."
    },
    "limit": {
      "type": "number",
      "description": "Number of items per page. Defaults to system configuration."
    }
  },
  "required": [
    "page",
    "limit"
  ],
  "additionalProperties": false,
  "description": "Standard query parameters for pagination."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» page|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
  "additionalProperties": false,
  "description": "DTO for creating a new address."
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
|description|string|false|none|none|

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
  "additionalProperties": false,
  "description": "DTO for updating an existing address. All fields are optional."
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
|description|string|false|none|none|

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
  "additionalProperties": false,
  "description": "DTO representing a full address."
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
|description|string|false|none|none|

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
      ],
      "description": "First name of the user."
    },
    "last_name": {
      "type": [
        "string",
        "null"
      ],
      "description": "Last name of the user."
    },
    "nrn": {
      "type": [
        "string",
        "null"
      ],
      "description": "National Register Number (or equivalent ID)."
    },
    "phone_number": {
      "type": [
        "string",
        "null"
      ],
      "description": "Contact phone number."
    },
    "email": {
      "type": "string",
      "description": "Email address (unique identifier)."
    },
    "iban": {
      "type": [
        "string",
        "null"
      ],
      "description": "International Bank Account Number."
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
      "additionalProperties": false,
      "description": "DTO representing a full address."
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
      "additionalProperties": false,
      "description": "DTO representing a full address."
    }
  },
  "required": [
    "id",
    "email"
  ],
  "additionalProperties": false,
  "description": "DTO representing a user's profile and contact information."
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
|»» description|string|false|none|none|
|» last_name|object|false|none|none|
|»» type|[string]|false|none|none|
|»» description|string|false|none|none|
|» nrn|object|false|none|none|
|»» type|[string]|false|none|none|
|»» description|string|false|none|none|
|» phone_number|object|false|none|none|
|»» type|[string]|false|none|none|
|»» description|string|false|none|none|
|» email|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» iban|object|false|none|none|
|»» type|[string]|false|none|none|
|»» description|string|false|none|none|
|» home_address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» billing_address|[AddressDTO](#schemaaddressdto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "additionalProperties": false,
      "description": "DTO for creating a new address."
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
      "additionalProperties": false,
      "description": "DTO for creating a new address."
    }
  },
  "additionalProperties": false,
  "description": "DTO for updating user information. All fields are optional; only provided fields will be updated."
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
|description|string|false|none|none|

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
  "additionalProperties": false,
  "description": "Custom validators must implement this interface to provide custom validation logic."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Page number to retrieve (1-based index). Defaults to 1."
    },
    "limit": {
      "type": "number",
      "description": "Number of items per page. Defaults to system configuration."
    },
    "description": {
      "type": "string",
      "description": "Filter by description."
    },
    "name": {
      "type": "string",
      "description": "Filter by name."
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
  ],
  "description": "DTO for querying keys with pagination and filtering."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» page|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» description|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» sort_name|[Sort](#schemasort)|false|none|none|
|additionalProperties|boolean|false|none|none|
|required|[string]|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Unique ID of the key."
    },
    "name": {
      "type": "string",
      "description": "Name of the key."
    },
    "description": {
      "type": "string",
      "description": "Description of the key."
    }
  },
  "required": [
    "id",
    "name",
    "description"
  ],
  "additionalProperties": false,
  "description": "Partial DTO representing a key (summary view)."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» description|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Unique ID of the consumer."
    },
    "name": {
      "type": "string",
      "description": "Name of the consumer."
    },
    "energy_allocated_percentage": {
      "type": "number",
      "description": "Energy allocated to this consumer (percentage or value)."
    }
  },
  "required": [
    "id",
    "name",
    "energy_allocated_percentage"
  ],
  "additionalProperties": false,
  "description": "DTO representing a consumer within an iteration."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» energy_allocated_percentage|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Unique ID of the iteration."
    },
    "number": {
      "type": "number",
      "description": "Iteration number (sequence)."
    },
    "energy_allocated_percentage": {
      "type": "number",
      "description": "Total energy allocated in this iteration."
    },
    "consumers": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "number",
            "description": "Unique ID of the consumer."
          },
          "name": {
            "type": "string",
            "description": "Name of the consumer."
          },
          "energy_allocated_percentage": {
            "type": "number",
            "description": "Energy allocated to this consumer (percentage or value)."
          }
        },
        "required": [
          "id",
          "name",
          "energy_allocated_percentage"
        ],
        "additionalProperties": false,
        "description": "DTO representing a consumer within an iteration."
      },
      "description": "List of consumers in this iteration."
    }
  },
  "required": [
    "id",
    "number",
    "energy_allocated_percentage",
    "consumers"
  ],
  "additionalProperties": false,
  "description": "DTO representing an iteration of the key distribution."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» energy_allocated_percentage|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» consumers|object|false|none|none|
|»» type|string|false|none|none|
|»» items|[ConsumerDTO](#schemaconsumerdto)|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Unique ID of the key."
    },
    "name": {
      "type": "string",
      "description": "Name of the key."
    },
    "description": {
      "type": "string",
      "description": "Description of the key."
    },
    "iterations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "number",
            "description": "Unique ID of the iteration."
          },
          "number": {
            "type": "number",
            "description": "Iteration number (sequence)."
          },
          "energy_allocated_percentage": {
            "type": "number",
            "description": "Total energy allocated in this iteration."
          },
          "consumers": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "number",
                  "description": "Unique ID of the consumer."
                },
                "name": {
                  "type": "string",
                  "description": "Name of the consumer."
                },
                "energy_allocated_percentage": {
                  "type": "number",
                  "description": "Energy allocated to this consumer (percentage or value)."
                }
              },
              "required": [
                "id",
                "name",
                "energy_allocated_percentage"
              ],
              "additionalProperties": false,
              "description": "DTO representing a consumer within an iteration."
            },
            "description": "List of consumers in this iteration."
          }
        },
        "required": [
          "id",
          "number",
          "energy_allocated_percentage",
          "consumers"
        ],
        "additionalProperties": false,
        "description": "DTO representing an iteration of the key distribution."
      },
      "description": "List of iterations defined for this key."
    }
  },
  "required": [
    "description",
    "id",
    "iterations",
    "name"
  ],
  "additionalProperties": false,
  "description": "Full DTO representing a key, including its iterations."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» description|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» iterations|object|false|none|none|
|»» type|string|false|none|none|
|»» items|[IterationDTO](#schemaiterationdto)|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "string",
      "description": "Name of the consumer."
    },
    "energy_allocated_percentage": {
      "type": "number",
      "description": "Energy allocated. Range: -1 (PRORATA) to 1 (100%)."
    }
  },
  "required": [
    "name",
    "energy_allocated_percentage"
  ],
  "additionalProperties": false,
  "description": "DTO for creating a new consumer."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» energy_allocated_percentage|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Iteration number (0, 1, or 2)."
    },
    "energy_allocated_percentage": {
      "type": "number",
      "description": "Total energy percentage for this iteration."
    },
    "consumers": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Name of the consumer."
          },
          "energy_allocated_percentage": {
            "type": "number",
            "description": "Energy allocated. Range: -1 (PRORATA) to 1 (100%)."
          }
        },
        "required": [
          "name",
          "energy_allocated_percentage"
        ],
        "additionalProperties": false,
        "description": "DTO for creating a new consumer."
      },
      "description": "List of consumers. Must adhere to sum constraints."
    }
  },
  "required": [
    "number",
    "energy_allocated_percentage",
    "consumers"
  ],
  "additionalProperties": false,
  "description": "DTO for creating a new iteration."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» energy_allocated_percentage|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» consumers|object|false|none|none|
|»» type|string|false|none|none|
|»» items|[CreateConsumerDTO](#schemacreateconsumerdto)|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "string",
      "description": "Name of the key."
    },
    "description": {
      "type": "string",
      "description": "Description of the key."
    },
    "iterations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "number": {
            "type": "number",
            "description": "Iteration number (0, 1, or 2)."
          },
          "energy_allocated_percentage": {
            "type": "number",
            "description": "Total energy percentage for this iteration."
          },
          "consumers": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string",
                  "description": "Name of the consumer."
                },
                "energy_allocated_percentage": {
                  "type": "number",
                  "description": "Energy allocated. Range: -1 (PRORATA) to 1 (100%)."
                }
              },
              "required": [
                "name",
                "energy_allocated_percentage"
              ],
              "additionalProperties": false,
              "description": "DTO for creating a new consumer."
            },
            "description": "List of consumers. Must adhere to sum constraints."
          }
        },
        "required": [
          "number",
          "energy_allocated_percentage",
          "consumers"
        ],
        "additionalProperties": false,
        "description": "DTO for creating a new iteration."
      },
      "description": "Iterations for the key. Must sum up correctly."
    }
  },
  "required": [
    "name",
    "description",
    "iterations"
  ],
  "additionalProperties": false,
  "description": "DTO for creating a new key."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» description|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» iterations|object|false|none|none|
|»» type|string|false|none|none|
|»» items|[CreateIterationDTO](#schemacreateiterationdto)|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "ID of the key to update."
    },
    "name": {
      "type": "string",
      "description": "New name."
    },
    "description": {
      "type": "string",
      "description": "New description."
    },
    "iterations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "number": {
            "type": "number",
            "description": "Iteration number (0, 1, or 2)."
          },
          "energy_allocated_percentage": {
            "type": "number",
            "description": "Total energy percentage for this iteration."
          },
          "consumers": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string",
                  "description": "Name of the consumer."
                },
                "energy_allocated_percentage": {
                  "type": "number",
                  "description": "Energy allocated. Range: -1 (PRORATA) to 1 (100%)."
                }
              },
              "required": [
                "name",
                "energy_allocated_percentage"
              ],
              "additionalProperties": false,
              "description": "DTO for creating a new consumer."
            },
            "description": "List of consumers. Must adhere to sum constraints."
          }
        },
        "required": [
          "number",
          "energy_allocated_percentage",
          "consumers"
        ],
        "additionalProperties": false,
        "description": "DTO for creating a new iteration."
      },
      "description": "New iterations configuration."
    }
  },
  "required": [
    "id",
    "name",
    "description",
    "iterations"
  ],
  "additionalProperties": false,
  "description": "DTO for updating an existing key."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» description|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» iterations|object|false|none|none|
|»» type|string|false|none|none|
|»» items|[CreateIterationDTO](#schemacreateiterationdto)|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Page number to retrieve (1-based index). Defaults to 1."
    },
    "limit": {
      "type": "number",
      "description": "Number of items per page. Defaults to system configuration."
    },
    "name": {
      "type": "string",
      "description": "Filter by name."
    },
    "type": {
      "type": "string",
      "description": "Filter by type of sharing operation."
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
  ],
  "description": "Query parameters for filtering and paginating a list of sharing operations."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» page|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» type|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» sort_name|[Sort](#schemasort)|false|none|none|
|» sort_type|[Sort](#schemasort)|false|none|none|
|additionalProperties|boolean|false|none|none|
|required|[string]|false|none|none|
|description|string|false|none|none|

<h2 id="tocS_SharingOperationMetersQueryType">SharingOperationMetersQueryType</h2>
<!-- backwards compatibility -->
<a id="schemasharingoperationmetersquerytype"></a>
<a id="schema_SharingOperationMetersQueryType"></a>
<a id="tocSsharingoperationmetersquerytype"></a>
<a id="tocssharingoperationmetersquerytype"></a>

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

<h2 id="tocS_SharingOperationMetersQuery">SharingOperationMetersQuery</h2>
<!-- backwards compatibility -->
<a id="schemasharingoperationmetersquery"></a>
<a id="schema_SharingOperationMetersQuery"></a>
<a id="tocSsharingoperationmetersquery"></a>
<a id="tocssharingoperationmetersquery"></a>

```json
{
  "type": "object",
  "properties": {
    "page": {
      "type": "number",
      "description": "Page number to retrieve (1-based index). Defaults to 1."
    },
    "limit": {
      "type": "number",
      "description": "Number of items per page. Defaults to system configuration."
    },
    "street": {
      "type": "string",
      "description": "Filter by street name."
    },
    "postcode": {
      "type": "number",
      "description": "Filter by postcode."
    },
    "address_number": {
      "type": "number",
      "description": "Filter by address number."
    },
    "city": {
      "type": "string",
      "description": "Filter by city name."
    },
    "supplement": {
      "type": "string",
      "description": "Filter by address supplement (box, etc.)."
    },
    "EAN": {
      "type": "string",
      "description": "Filter by EAN code."
    },
    "meter_number": {
      "type": "string",
      "description": "Filter by meter number."
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
    "holder_id": {
      "type": "number",
      "description": "Filter by generic member ID holder."
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
    "limit",
    "page",
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
|» page|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» street|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» postcode|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» address_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» city|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» supplement|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» EAN|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» meter_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» status|[MeterDataStatus](#schemameterdatastatus)|false|none|none|
|» holder_id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» type|[SharingOperationMetersQueryType](#schemasharingoperationmetersquerytype)|false|none|none|
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
      "format": "date-time",
      "description": "Start date for the data range."
    },
    "date_end": {
      "type": "string",
      "format": "date-time",
      "description": "End date for the data range."
    }
  },
  "additionalProperties": false,
  "description": "Query parameters for retrieving sharing operation consumption data."
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
|»» description|string|false|none|none|
|» date_end|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|»» description|string|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Unique identifier."
    },
    "name": {
      "type": "string",
      "description": "Name of the sharing operation."
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
  "additionalProperties": false,
  "description": "Simplified DTO for a sharing operation (partial view), typically used in lists."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» type|[SharingOperationType](#schemasharingoperationtype)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
          "type": "number",
          "description": "Unique ID of the key."
        },
        "name": {
          "type": "string",
          "description": "Name of the key."
        },
        "description": {
          "type": "string",
          "description": "Description of the key."
        }
      },
      "required": [
        "id",
        "name",
        "description"
      ],
      "additionalProperties": false,
      "description": "Partial DTO representing a key (summary view)."
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
    "status"
  ],
  "additionalProperties": false,
  "description": "DTO representing a key associated with a sharing operation."
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
|description|string|false|none|none|

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
      "type": "number",
      "description": "Unique identifier."
    },
    "name": {
      "type": "string",
      "description": "Name of the sharing operation."
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
              "type": "number",
              "description": "Unique ID of the key."
            },
            "name": {
              "type": "string",
              "description": "Name of the key."
            },
            "description": {
              "type": "string",
              "description": "Description of the key."
            }
          },
          "required": [
            "id",
            "name",
            "description"
          ],
          "additionalProperties": false,
          "description": "Partial DTO representing a key (summary view)."
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
        "status"
      ],
      "additionalProperties": false,
      "description": "DTO representing a key associated with a sharing operation."
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
              "type": "number",
              "description": "Unique ID of the key."
            },
            "name": {
              "type": "string",
              "description": "Name of the key."
            },
            "description": {
              "type": "string",
              "description": "Description of the key."
            }
          },
          "required": [
            "id",
            "name",
            "description"
          ],
          "additionalProperties": false,
          "description": "Partial DTO representing a key (summary view)."
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
        "status"
      ],
      "additionalProperties": false,
      "description": "DTO representing a key associated with a sharing operation."
    }
  },
  "required": [
    "id",
    "key",
    "key_waiting_approval",
    "name",
    "type"
  ],
  "additionalProperties": false,
  "description": "Full DTO including keys and history for a sharing operation."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» type|[SharingOperationType](#schemasharingoperationtype)|false|none|none|
|» key|[SharingOperationKeyDTO](#schemasharingoperationkeydto)|false|none|none|
|» key_waiting_approval|[SharingOperationKeyDTO](#schemasharingoperationkeydto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
  "additionalProperties": false,
  "description": "DTO containing time-series consumption/injection data for a sharing operation."
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
|description|string|false|none|none|

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
  "additionalProperties": false,
  "description": "DTO for creating a new sharing operation."
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
|description|string|false|none|none|

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
  "additionalProperties": false,
  "description": "DTO for associating a key with a sharing operation."
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
|description|string|false|none|none|

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
  "additionalProperties": false,
  "description": "DTO for adding meters to a sharing operation."
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
|description|string|false|none|none|

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
          "type": "string",
          "description": "Name of the form field associated with this file."
        },
        "originalname": {
          "type": "string",
          "description": "Name of the file on the uploader's computer."
        },
        "encoding": {
          "type": "string",
          "description": "Value of the `Content-Transfer-Encoding` header for this file.",
          "deprecated": "since July 2015"
        },
        "mimetype": {
          "type": "string",
          "description": "Value of the `Content-Type` header for this file."
        },
        "size": {
          "type": "number",
          "description": "Size of the file in bytes."
        },
        "stream": {
          "type": "object",
          "properties": {
            "readable": {
              "type": "boolean",
              "description": "Is `true` if it is safe to call  {@link  read } , which means the stream has not been destroyed or emitted `'error'` or `'end'`."
            },
            "readableAborted": {
              "type": "boolean",
              "description": "Returns whether the stream was destroyed or errored before emitting `'end'`."
            },
            "readableDidRead": {
              "type": "boolean",
              "description": "Returns whether `'data'` has been emitted."
            },
            "readableEncoding": {
              "anyOf": [
                {
                  "type": "null"
                }
              ],
              "description": "Getter for the property `encoding` of a given `Readable` stream. The `encoding` property can be set using the  {@link  setEncoding }  method."
            },
            "readableEnded": {
              "type": "boolean",
              "description": "Becomes `true` when [`'end'`](https://nodejs.org/docs/latest-v25.x/api/stream.html#event-end) event is emitted."
            },
            "readableFlowing": {
              "type": [
                "boolean",
                "null"
              ],
              "description": "This property reflects the current state of a `Readable` stream as described in the [Three states](https://nodejs.org/docs/latest-v25.x/api/stream.html#three-states) section."
            },
            "readableHighWaterMark": {
              "type": "number",
              "description": "Returns the value of `highWaterMark` passed when creating this `Readable`."
            },
            "readableLength": {
              "type": "number",
              "description": "This property contains the number of bytes (or objects) in the queue ready to be read. The value provides introspection data regarding the status of the `highWaterMark`."
            },
            "readableObjectMode": {
              "type": "boolean",
              "description": "Getter for the property `objectMode` of a given `Readable` stream."
            },
            "destroyed": {
              "type": "boolean",
              "description": "Is `true` after `readable.destroy()` has been called."
            },
            "closed": {
              "type": "boolean",
              "description": "Is `true` after `'close'` has been emitted."
            },
            "errored": {
              "anyOf": [
                {
                  "type": "null"
                }
              ],
              "description": "Returns error if the stream has been destroyed with an error."
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
          "type": "string",
          "description": "`DiskStorage` only: Directory to which this file has been uploaded."
        },
        "filename": {
          "type": "string",
          "description": "`DiskStorage` only: Name of this file within `destination`."
        },
        "path": {
          "type": "string",
          "description": "`DiskStorage` only: Full path to the uploaded file."
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
      "additionalProperties": false,
      "description": "Object containing file metadata and access information."
    }
  },
  "required": [
    "id_sharing_operation",
    "file"
  ],
  "additionalProperties": false,
  "description": "DTO for uploading consumption data (file upload)."
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
|description|string|false|none|none|

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
      "type": "string",
      "description": "Name of the form field associated with this file."
    },
    "originalname": {
      "type": "string",
      "description": "Name of the file on the uploader's computer."
    },
    "encoding": {
      "type": "string",
      "description": "Value of the `Content-Transfer-Encoding` header for this file.",
      "deprecated": "since July 2015"
    },
    "mimetype": {
      "type": "string",
      "description": "Value of the `Content-Type` header for this file."
    },
    "size": {
      "type": "number",
      "description": "Size of the file in bytes."
    },
    "stream": {
      "type": "object",
      "properties": {
        "readable": {
          "type": "boolean",
          "description": "Is `true` if it is safe to call  {@link  read } , which means the stream has not been destroyed or emitted `'error'` or `'end'`."
        },
        "readableAborted": {
          "type": "boolean",
          "description": "Returns whether the stream was destroyed or errored before emitting `'end'`."
        },
        "readableDidRead": {
          "type": "boolean",
          "description": "Returns whether `'data'` has been emitted."
        },
        "readableEncoding": {
          "anyOf": [
            {
              "type": "null"
            }
          ],
          "description": "Getter for the property `encoding` of a given `Readable` stream. The `encoding` property can be set using the  {@link  setEncoding }  method."
        },
        "readableEnded": {
          "type": "boolean",
          "description": "Becomes `true` when [`'end'`](https://nodejs.org/docs/latest-v25.x/api/stream.html#event-end) event is emitted."
        },
        "readableFlowing": {
          "type": [
            "boolean",
            "null"
          ],
          "description": "This property reflects the current state of a `Readable` stream as described in the [Three states](https://nodejs.org/docs/latest-v25.x/api/stream.html#three-states) section."
        },
        "readableHighWaterMark": {
          "type": "number",
          "description": "Returns the value of `highWaterMark` passed when creating this `Readable`."
        },
        "readableLength": {
          "type": "number",
          "description": "This property contains the number of bytes (or objects) in the queue ready to be read. The value provides introspection data regarding the status of the `highWaterMark`."
        },
        "readableObjectMode": {
          "type": "boolean",
          "description": "Getter for the property `objectMode` of a given `Readable` stream."
        },
        "destroyed": {
          "type": "boolean",
          "description": "Is `true` after `readable.destroy()` has been called."
        },
        "closed": {
          "type": "boolean",
          "description": "Is `true` after `'close'` has been emitted."
        },
        "errored": {
          "anyOf": [
            {
              "type": "null"
            }
          ],
          "description": "Returns error if the stream has been destroyed with an error."
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
      "type": "string",
      "description": "`DiskStorage` only: Directory to which this file has been uploaded."
    },
    "filename": {
      "type": "string",
      "description": "`DiskStorage` only: Name of this file within `destination`."
    },
    "path": {
      "type": "string",
      "description": "`DiskStorage` only: Full path to the uploaded file."
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
  "additionalProperties": false,
  "description": "Object containing file metadata and access information."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» fieldname|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» originalname|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» encoding|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|»» deprecated|string|false|none|none|
|» mimetype|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» size|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» stream|[Stream.Readable](#schemastream.readable)|false|none|none|
|» destination|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» filename|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» path|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» buffer|[global.Buffer](#schemaglobal.buffer)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "boolean",
      "description": "Is `true` if it is safe to call  {@link  read } , which means the stream has not been destroyed or emitted `'error'` or `'end'`."
    },
    "readableAborted": {
      "type": "boolean",
      "description": "Returns whether the stream was destroyed or errored before emitting `'end'`."
    },
    "readableDidRead": {
      "type": "boolean",
      "description": "Returns whether `'data'` has been emitted."
    },
    "readableEncoding": {
      "anyOf": [
        {
          "type": "null"
        }
      ],
      "description": "Getter for the property `encoding` of a given `Readable` stream. The `encoding` property can be set using the  {@link  setEncoding }  method."
    },
    "readableEnded": {
      "type": "boolean",
      "description": "Becomes `true` when [`'end'`](https://nodejs.org/docs/latest-v25.x/api/stream.html#event-end) event is emitted."
    },
    "readableFlowing": {
      "type": [
        "boolean",
        "null"
      ],
      "description": "This property reflects the current state of a `Readable` stream as described in the [Three states](https://nodejs.org/docs/latest-v25.x/api/stream.html#three-states) section."
    },
    "readableHighWaterMark": {
      "type": "number",
      "description": "Returns the value of `highWaterMark` passed when creating this `Readable`."
    },
    "readableLength": {
      "type": "number",
      "description": "This property contains the number of bytes (or objects) in the queue ready to be read. The value provides introspection data regarding the status of the `highWaterMark`."
    },
    "readableObjectMode": {
      "type": "boolean",
      "description": "Getter for the property `objectMode` of a given `Readable` stream."
    },
    "destroyed": {
      "type": "boolean",
      "description": "Is `true` after `readable.destroy()` has been called."
    },
    "closed": {
      "type": "boolean",
      "description": "Is `true` after `'close'` has been emitted."
    },
    "errored": {
      "anyOf": [
        {
          "type": "null"
        }
      ],
      "description": "Returns error if the stream has been destroyed with an error."
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
|»» description|string|false|none|none|
|» readableAborted|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» readableDidRead|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» readableEncoding|object|false|none|none|
|»» anyOf|[object]|false|none|none|
|»»» type|string|false|none|none|
|»» description|string|false|none|none|
|» readableEnded|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» readableFlowing|object|false|none|none|
|»» type|[string]|false|none|none|
|»» description|string|false|none|none|
|» readableHighWaterMark|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» readableLength|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» readableObjectMode|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» destroyed|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» closed|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» errored|object|false|none|none|
|»» anyOf|[object]|false|none|none|
|»»» type|string|false|none|none|
|»» description|string|false|none|none|
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
  "additionalProperties": false,
  "description": "DTO for updating the status of a key in a sharing operation."
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
|description|string|false|none|none|

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
  "additionalProperties": false,
  "description": "DTO for updating the status of a meter within a sharing operation."
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
|description|string|false|none|none|

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
  "additionalProperties": false,
  "description": "DTO for removing a meter from a sharing operation."
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
|description|string|false|none|none|

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
      "type": "number",
      "description": "Page number to retrieve (1-based index). Defaults to 1."
    },
    "limit": {
      "type": "number",
      "description": "Number of items per page. Defaults to system configuration."
    },
    "name": {
      "type": "string",
      "description": "Filter by member name."
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
  ],
  "description": "DTO for querying members with pagination, filtering, and sorting."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» page|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» member_type|[MemberType](#schemamembertype)|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|» sort_name|[Sort](#schemasort)|false|none|none|
|additionalProperties|boolean|false|none|none|
|required|[string]|false|none|none|
|description|string|false|none|none|

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

<h2 id="tocS_MemberLinkQueryDTO">MemberLinkQueryDTO</h2>
<!-- backwards compatibility -->
<a id="schemamemberlinkquerydto"></a>
<a id="schema_MemberLinkQueryDTO"></a>
<a id="tocSmemberlinkquerydto"></a>
<a id="tocsmemberlinkquerydto"></a>

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string"
    }
  },
  "required": [
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
|» email|object|false|none|none|
|»» type|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

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
      "type": "number",
      "description": "Unique ID of the member."
    },
    "name": {
      "type": "string",
      "description": "Name of the member."
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
  "additionalProperties": false,
  "description": "Partial DTO representing a member (summary view)."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» member_type|[MemberType](#schemamembertype)|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Unique ID of the member."
    },
    "name": {
      "type": "string",
      "description": "Name of the member."
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
      "type": "string",
      "description": "IBAN of the member."
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
      "additionalProperties": false,
      "description": "DTO representing a full address."
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
      "additionalProperties": false,
      "description": "DTO representing a full address."
    },
    "user_link_email": {
      "type": "string",
      "description": "Linked user email, if associated with a user account."
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
  "additionalProperties": false,
  "description": "Full DTO representing a member, including address definitions."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» member_type|[MemberType](#schemamembertype)|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|» iban|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» home_address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» billing_address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» user_link_email|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Unique ID of the manager."
    },
    "NRN": {
      "type": "string",
      "description": "National Registry Number of the manager."
    },
    "name": {
      "type": "string",
      "description": "First name of the manager."
    },
    "surname": {
      "type": "string",
      "description": "Surname of the manager."
    },
    "email": {
      "type": "string",
      "description": "Email address of the manager."
    },
    "phone_number": {
      "type": "string",
      "description": "Phone number of the manager."
    }
  },
  "required": [
    "id",
    "NRN",
    "name",
    "surname",
    "email"
  ],
  "additionalProperties": false,
  "description": "DTO representing a manager associated with a member."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» NRN|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» surname|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» email|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» phone_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

<h2 id="tocS_CreateManagerDTO">CreateManagerDTO</h2>
<!-- backwards compatibility -->
<a id="schemacreatemanagerdto"></a>
<a id="schema_CreateManagerDTO"></a>
<a id="tocScreatemanagerdto"></a>
<a id="tocscreatemanagerdto"></a>

```json
{
  "type": "object",
  "properties": {
    "NRN": {
      "type": "string",
      "description": "National Registry Number of the manager."
    },
    "name": {
      "type": "string",
      "description": "First name of the manager."
    },
    "surname": {
      "type": "string",
      "description": "Surname of the manager."
    },
    "email": {
      "type": "string",
      "description": "Email address of the manager."
    },
    "phone_number": {
      "type": "string",
      "description": "Phone number of the manager."
    }
  },
  "required": [
    "NRN",
    "name",
    "surname",
    "email"
  ],
  "additionalProperties": false,
  "description": "DTO representing a manager associated with a member."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» NRN|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» surname|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» email|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» phone_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Unique ID of the member."
    },
    "name": {
      "type": "string",
      "description": "Name of the member."
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
      "type": "string",
      "description": "IBAN of the member."
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
      "additionalProperties": false,
      "description": "DTO representing a full address."
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
      "additionalProperties": false,
      "description": "DTO representing a full address."
    },
    "user_link_email": {
      "type": "string",
      "description": "Linked user email, if associated with a user account."
    },
    "NRN": {
      "type": "string",
      "description": "National Registry Number."
    },
    "first_name": {
      "type": "string",
      "description": "First name."
    },
    "email": {
      "type": "string",
      "description": "Contact email."
    },
    "phone_number": {
      "type": "string",
      "description": "Phone number."
    },
    "social_rate": {
      "type": "boolean",
      "description": "Whether the social rate applies."
    },
    "manager": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number",
          "description": "Unique ID of the manager."
        },
        "NRN": {
          "type": "string",
          "description": "National Registry Number of the manager."
        },
        "name": {
          "type": "string",
          "description": "First name of the manager."
        },
        "surname": {
          "type": "string",
          "description": "Surname of the manager."
        },
        "email": {
          "type": "string",
          "description": "Email address of the manager."
        },
        "phone_number": {
          "type": "string",
          "description": "Phone number of the manager."
        }
      },
      "required": [
        "id",
        "NRN",
        "name",
        "surname",
        "email"
      ],
      "additionalProperties": false,
      "description": "DTO representing a manager associated with a member."
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
  "additionalProperties": false,
  "description": "Data Transfer Object for individual members Extends MembersDTO with individual-specific information"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» member_type|[MemberType](#schemamembertype)|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|» iban|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» home_address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» billing_address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» user_link_email|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» NRN|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» first_name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» email|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» phone_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» social_rate|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» manager|[ManagerDTO](#schemamanagerdto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Unique ID of the member."
    },
    "name": {
      "type": "string",
      "description": "Name of the member."
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
      "type": "string",
      "description": "IBAN of the member."
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
      "additionalProperties": false,
      "description": "DTO representing a full address."
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
      "additionalProperties": false,
      "description": "DTO representing a full address."
    },
    "user_link_email": {
      "type": "string",
      "description": "Linked user email, if associated with a user account."
    },
    "vat_number": {
      "type": "string",
      "description": "VAT number of the company."
    },
    "manager": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number",
          "description": "Unique ID of the manager."
        },
        "NRN": {
          "type": "string",
          "description": "National Registry Number of the manager."
        },
        "name": {
          "type": "string",
          "description": "First name of the manager."
        },
        "surname": {
          "type": "string",
          "description": "Surname of the manager."
        },
        "email": {
          "type": "string",
          "description": "Email address of the manager."
        },
        "phone_number": {
          "type": "string",
          "description": "Phone number of the manager."
        }
      },
      "required": [
        "id",
        "NRN",
        "name",
        "surname",
        "email"
      ],
      "additionalProperties": false,
      "description": "DTO representing a manager associated with a member."
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
  "additionalProperties": false,
  "description": "Data Transfer Object for legal entity members Extends MembersDTO with legal entity-specific information"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» member_type|[MemberType](#schemamembertype)|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|» iban|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» home_address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» billing_address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» user_link_email|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» vat_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» manager|[ManagerDTO](#schemamanagerdto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "string",
      "description": "Name of the member (Full name or Company name)."
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
      "type": "string",
      "description": "IBAN of the member."
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
      "additionalProperties": false,
      "description": "DTO for creating a new address."
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
      "additionalProperties": false,
      "description": "DTO for creating a new address."
    },
    "first_name": {
      "type": "string",
      "description": "First name (Individual only)."
    },
    "NRN": {
      "type": "string",
      "description": "National Registry Number (Individual only)."
    },
    "email": {
      "type": "string",
      "description": "Contact email (Individual only)."
    },
    "phone_number": {
      "type": "string",
      "description": "Phone number (Individual only)."
    },
    "social_rate": {
      "type": "boolean",
      "description": "Social rate eligibility (Individual only)."
    },
    "vat_number": {
      "type": "string",
      "description": "VAT number (Company only)."
    },
    "manager": {
      "type": "object",
      "properties": {
        "NRN": {
          "type": "string",
          "description": "National Registry Number of the manager."
        },
        "name": {
          "type": "string",
          "description": "First name of the manager."
        },
        "surname": {
          "type": "string",
          "description": "Surname of the manager."
        },
        "email": {
          "type": "string",
          "description": "Email address of the manager."
        },
        "phone_number": {
          "type": "string",
          "description": "Phone number of the manager."
        }
      },
      "required": [
        "NRN",
        "name",
        "surname",
        "email"
      ],
      "additionalProperties": false,
      "description": "DTO representing a manager associated with a member."
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
  "additionalProperties": false,
  "description": "DTO for creating a new member. Contains common fields and type-specific fields (Individual vs Company). Uses conditional validation based on `member_type`."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» member_type|[MemberType](#schemamembertype)|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|» iban|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» home_address|[CreateAddressDTO](#schemacreateaddressdto)|false|none|none|
|» billing_address|[CreateAddressDTO](#schemacreateaddressdto)|false|none|none|
|» first_name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» NRN|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» email|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» phone_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» social_rate|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» vat_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» manager|[CreateManagerDTO](#schemacreatemanagerdto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "ID of the member to update."
    },
    "name": {
      "type": "string",
      "description": "New name."
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
      "type": "string",
      "description": "New IBAN."
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
      "additionalProperties": false,
      "description": "DTO for updating an existing address. All fields are optional."
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
      "additionalProperties": false,
      "description": "DTO for updating an existing address. All fields are optional."
    },
    "first_name": {
      "type": "string",
      "description": "Update first name."
    },
    "NRN": {
      "type": "string",
      "description": "Update NRN."
    },
    "email": {
      "type": "string",
      "description": "Update email."
    },
    "phone_number": {
      "type": "string",
      "description": "Update phone number."
    },
    "social_rate": {
      "type": "boolean",
      "description": "Update social rate."
    },
    "vat_number": {
      "type": "string",
      "description": "Update VAT number."
    },
    "manager": {
      "type": "object",
      "properties": {
        "NRN": {
          "type": "string",
          "description": "National Registry Number of the manager."
        },
        "name": {
          "type": "string",
          "description": "First name of the manager."
        },
        "surname": {
          "type": "string",
          "description": "Surname of the manager."
        },
        "email": {
          "type": "string",
          "description": "Email address of the manager."
        },
        "phone_number": {
          "type": "string",
          "description": "Phone number of the manager."
        }
      },
      "required": [
        "NRN",
        "name",
        "surname",
        "email"
      ],
      "additionalProperties": false,
      "description": "DTO representing a manager associated with a member."
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false,
  "description": "DTO for updating an existing member. Most fields are optional to allow partial updates."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|» iban|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» home_address|[UpdateAddressDTO](#schemaupdateaddressdto)|false|none|none|
|» billing_address|[UpdateAddressDTO](#schemaupdateaddressdto)|false|none|none|
|» first_name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» NRN|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» email|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» phone_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» social_rate|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» vat_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» manager|[CreateManagerDTO](#schemacreatemanagerdto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "ID of the member."
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
  "additionalProperties": false,
  "description": "DTO for patching member status only."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id_member|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "ID of the member."
    },
    "user_email": {
      "type": "string",
      "description": "Email of the user to invite."
    }
  },
  "required": [
    "id_member",
    "user_email"
  ],
  "additionalProperties": false,
  "description": "DTO for inviting a user to link to a member account."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id_member|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» user_email|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "string",
      "description": "Email of the linked user (or invited email)."
    },
    "user_id": {
      "type": "number",
      "description": "User ID if linked."
    },
    "status": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    },
    "id": {
      "type": "number",
      "description": "Id either of the member link or of the member invitation"
    }
  },
  "additionalProperties": false,
  "description": "DTO representing the link status between a member and a user account."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» user_email|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» user_id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Page number to retrieve (1-based index). Defaults to 1."
    },
    "limit": {
      "type": "number",
      "description": "Number of items per page. Defaults to system configuration."
    },
    "street": {
      "type": "string",
      "description": "Filter by street name."
    },
    "postcode": {
      "type": "number",
      "description": "Filter by postcode."
    },
    "address_number": {
      "type": "number",
      "description": "Filter by address number."
    },
    "city": {
      "type": "string",
      "description": "Filter by city name."
    },
    "supplement": {
      "type": "string",
      "description": "Filter by address supplement (box, etc.)."
    },
    "EAN": {
      "type": "string",
      "description": "Filter by EAN code."
    },
    "meter_number": {
      "type": "string",
      "description": "Filter by meter number."
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
      "type": "number",
      "description": "Filter by active sharing operation ID."
    },
    "not_sharing_operation_id": {
      "type": "number",
      "description": "Filter by explicitly NOT being in a specific sharing operation ID."
    },
    "holder_id": {
      "type": "number",
      "description": "Filter by generic member ID holder."
    }
  },
  "additionalProperties": false,
  "required": [
    "limit",
    "page"
  ],
  "description": "Query parameters for filtering and paginating a list of meters."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» page|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» street|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» postcode|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» address_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» city|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» supplement|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» EAN|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» meter_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» status|[MeterDataStatus](#schemameterdatastatus)|false|none|none|
|» sharing_operation_id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» not_sharing_operation_id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» holder_id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|additionalProperties|boolean|false|none|none|
|required|[string]|false|none|none|
|description|string|false|none|none|

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
      "format": "date-time",
      "description": "Start date for the data range."
    },
    "date_end": {
      "type": "string",
      "format": "date-time",
      "description": "End date for the data range."
    }
  },
  "additionalProperties": false,
  "description": "Query parameters for retrieving meter consumption data."
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
|»» description|string|false|none|none|
|» date_end|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|»» description|string|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "string",
      "description": "EAN code of the meter."
    },
    "meter_number": {
      "type": "string",
      "description": "Physical meter number."
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
      "additionalProperties": false,
      "description": "DTO representing a full address."
    },
    "holder": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number",
          "description": "Unique ID of the member."
        },
        "name": {
          "type": "string",
          "description": "Name of the member."
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
      "additionalProperties": false,
      "description": "Partial DTO representing a member (summary view)."
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
          "type": "number",
          "description": "Unique identifier."
        },
        "name": {
          "type": "string",
          "description": "Name of the sharing operation."
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
      "additionalProperties": false,
      "description": "Simplified DTO for a sharing operation (partial view), typically used in lists."
    }
  },
  "required": [
    "EAN",
    "meter_number",
    "address",
    "status"
  ],
  "additionalProperties": false,
  "description": "Simplified DTO for a meter (partial view), typically used in lists."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» EAN|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» meter_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» holder|[MembersPartialDTO](#schemamemberspartialdto)|false|none|none|
|» status|[MeterDataStatus](#schemameterdatastatus)|false|none|none|
|» sharing_operation|[SharingOperationPartialDTO](#schemasharingoperationpartialdto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
          "type": "number",
          "description": "Unique ID of the member."
        },
        "name": {
          "type": "string",
          "description": "Name of the member."
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
      "additionalProperties": false,
      "description": "Partial DTO representing a member (summary view)."
    },
    "grd": {
      "type": "string"
    },
    "sharing_operation": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number",
          "description": "Unique identifier."
        },
        "name": {
          "type": "string",
          "description": "Name of the sharing operation."
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
      "additionalProperties": false,
      "description": "Simplified DTO for a sharing operation (partial view), typically used in lists."
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
  "additionalProperties": false,
  "description": "DTO representing detailed meter configuration and status for a specific period (history/current/future)."
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
|description|string|false|none|none|

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
      "additionalProperties": false,
      "description": "DTO representing a full address."
    },
    "holder": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number",
          "description": "Unique ID of the member."
        },
        "name": {
          "type": "string",
          "description": "Name of the member."
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
      "additionalProperties": false,
      "description": "Partial DTO representing a member (summary view)."
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
              "type": "number",
              "description": "Unique ID of the member."
            },
            "name": {
              "type": "string",
              "description": "Name of the member."
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
          "additionalProperties": false,
          "description": "Partial DTO representing a member (summary view)."
        },
        "grd": {
          "type": "string"
        },
        "sharing_operation": {
          "type": "object",
          "properties": {
            "id": {
              "type": "number",
              "description": "Unique identifier."
            },
            "name": {
              "type": "string",
              "description": "Name of the sharing operation."
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
          "additionalProperties": false,
          "description": "Simplified DTO for a sharing operation (partial view), typically used in lists."
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
      "additionalProperties": false,
      "description": "DTO representing detailed meter configuration and status for a specific period (history/current/future)."
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
                "type": "number",
                "description": "Unique ID of the member."
              },
              "name": {
                "type": "string",
                "description": "Name of the member."
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
            "additionalProperties": false,
            "description": "Partial DTO representing a member (summary view)."
          },
          "grd": {
            "type": "string"
          },
          "sharing_operation": {
            "type": "object",
            "properties": {
              "id": {
                "type": "number",
                "description": "Unique identifier."
              },
              "name": {
                "type": "string",
                "description": "Name of the sharing operation."
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
            "additionalProperties": false,
            "description": "Simplified DTO for a sharing operation (partial view), typically used in lists."
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
        "additionalProperties": false,
        "description": "DTO representing detailed meter configuration and status for a specific period (history/current/future)."
      },
      "description": "Historical meter data configurations."
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
                "type": "number",
                "description": "Unique ID of the member."
              },
              "name": {
                "type": "string",
                "description": "Name of the member."
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
            "additionalProperties": false,
            "description": "Partial DTO representing a member (summary view)."
          },
          "grd": {
            "type": "string"
          },
          "sharing_operation": {
            "type": "object",
            "properties": {
              "id": {
                "type": "number",
                "description": "Unique identifier."
              },
              "name": {
                "type": "string",
                "description": "Name of the sharing operation."
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
            "additionalProperties": false,
            "description": "Simplified DTO for a sharing operation (partial view), typically used in lists."
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
        "additionalProperties": false,
        "description": "DTO representing detailed meter configuration and status for a specific period (history/current/future)."
      },
      "description": "Future scheduled meter data configurations."
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
  "additionalProperties": false,
  "description": "Full DTO including physical properties and timeline of data configurations."
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
|»» description|string|false|none|none|
|» futur_meter_data|object|false|none|none|
|»» type|string|false|none|none|
|»» items|[MetersDataDTO](#schemametersdatadto)|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "string",
      "description": "EAN code."
    },
    "timestamps": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Array of timestamps."
    },
    "gross": {
      "type": "array",
      "items": {
        "type": "number"
      },
      "description": "Gross consumption values."
    },
    "net": {
      "type": "array",
      "items": {
        "type": "number"
      },
      "description": "Net consumption values."
    },
    "shared": {
      "type": "array",
      "items": {
        "type": "number"
      },
      "description": "Shared consumption values."
    },
    "inj_gross": {
      "type": "array",
      "items": {
        "type": "number"
      },
      "description": "Gross injection values."
    },
    "inj_net": {
      "type": "array",
      "items": {
        "type": "number"
      },
      "description": "Net injection values."
    },
    "inj_shared": {
      "type": "array",
      "items": {
        "type": "number"
      },
      "description": "Shared injection values."
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
  "additionalProperties": false,
  "description": "DTO containing time-series consumption/injection data."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» EAN|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» timestamps|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|»» description|string|false|none|none|
|» gross|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|»» description|string|false|none|none|
|» net|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|»» description|string|false|none|none|
|» shared|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|»» description|string|false|none|none|
|» inj_gross|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|»» description|string|false|none|none|
|» inj_net|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|»» description|string|false|none|none|
|» inj_shared|object|false|none|none|
|»» type|string|false|none|none|
|»» items|object|false|none|none|
|»»» type|string|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "format": "date-time",
      "description": "Start date of validity for this configuration."
    },
    "end_date": {
      "type": "string",
      "format": "date-time",
      "description": "End date of validity (optional)."
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
      "type": "string",
      "description": "Description or label."
    },
    "sampling_power": {
      "type": "number",
      "description": "Sampling power."
    },
    "amperage": {
      "type": "number",
      "description": "Amperage."
    },
    "grd": {
      "type": "string",
      "description": "GRD (DSO) identifier."
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
      "type": "number",
      "description": "Total generating capacity."
    },
    "member_id": {
      "type": "number",
      "description": "ID of the associated member (holder)."
    },
    "sharing_operation_id": {
      "type": "number",
      "description": "ID of the associated sharing operation."
    }
  },
  "required": [
    "start_date",
    "status",
    "rate",
    "client_type"
  ],
  "additionalProperties": false,
  "description": "DTO for creating or updating a MeterData configuration period."
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
|»» description|string|false|none|none|
|» end_date|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|»» description|string|false|none|none|
|» status|[MeterDataStatus](#schemameterdatastatus)|false|none|none|
|» rate|[MeterRate](#schemameterrate)|false|none|none|
|» client_type|[ClientType](#schemaclienttype)|false|none|none|
|» description|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» sampling_power|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» amperage|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» grd|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» injection_status|[InjectionStatus](#schemainjectionstatus)|false|none|none|
|» production_chain|[ProductionChain](#schemaproductionchain)|false|none|none|
|» total_generating_capacity|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» member_id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» sharing_operation_id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "string",
      "description": "EAN Code (Unique Identifier)."
    },
    "meter_number": {
      "type": "string",
      "description": "Physical Meter Number."
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
      "additionalProperties": false,
      "description": "DTO for creating a new address."
    },
    "tarif_group": {
      "type": "number",
      "enum": [
        1,
        2
      ]
    },
    "phases_number": {
      "type": "number",
      "description": "Number of phases (min 1)."
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
          "format": "date-time",
          "description": "Start date of validity for this configuration."
        },
        "end_date": {
          "type": "string",
          "format": "date-time",
          "description": "End date of validity (optional)."
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
          "type": "string",
          "description": "Description or label."
        },
        "sampling_power": {
          "type": "number",
          "description": "Sampling power."
        },
        "amperage": {
          "type": "number",
          "description": "Amperage."
        },
        "grd": {
          "type": "string",
          "description": "GRD (DSO) identifier."
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
          "type": "number",
          "description": "Total generating capacity."
        },
        "member_id": {
          "type": "number",
          "description": "ID of the associated member (holder)."
        },
        "sharing_operation_id": {
          "type": "number",
          "description": "ID of the associated sharing operation."
        }
      },
      "required": [
        "start_date",
        "status",
        "rate",
        "client_type"
      ],
      "additionalProperties": false,
      "description": "DTO for creating or updating a MeterData configuration period."
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
  "additionalProperties": false,
  "description": "DTO for creating a new physical meter and its initial configuration."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» EAN|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» meter_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» address|[CreateAddressDTO](#schemacreateaddressdto)|false|none|none|
|» tarif_group|[TarifGroup](#schematarifgroup)|false|none|none|
|» phases_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» reading_frequency|[ReadingFrequency](#schemareadingfrequency)|false|none|none|
|» initial_data|[CreateMeterDataDTO](#schemacreatemeterdatadto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

<h2 id="tocS_UpdateMeterDTO">UpdateMeterDTO</h2>
<!-- backwards compatibility -->
<a id="schemaupdatemeterdto"></a>
<a id="schema_UpdateMeterDTO"></a>
<a id="tocSupdatemeterdto"></a>
<a id="tocsupdatemeterdto"></a>

```json
{
  "type": "object",
  "properties": {
    "EAN": {
      "type": "string",
      "description": "EAN Code (Unique Identifier)."
    },
    "meter_number": {
      "type": "string",
      "description": "Physical Meter Number."
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
      "additionalProperties": false,
      "description": "DTO for creating a new address."
    },
    "tarif_group": {
      "type": "number",
      "enum": [
        1,
        2
      ]
    },
    "phases_number": {
      "type": "number",
      "description": "Number of phases (min 1)."
    },
    "reading_frequency": {
      "type": "number",
      "enum": [
        1,
        2
      ]
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
|»» description|string|false|none|none|
|» meter_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» address|[CreateAddressDTO](#schemacreateaddressdto)|false|none|none|
|» tarif_group|[TarifGroup](#schematarifgroup)|false|none|none|
|» phases_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» reading_frequency|[ReadingFrequency](#schemareadingfrequency)|false|none|none|
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
      "format": "date-time",
      "description": "Start date of validity for this configuration."
    },
    "end_date": {
      "type": "string",
      "format": "date-time",
      "description": "End date of validity (optional)."
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
      "type": "string",
      "description": "Description or label."
    },
    "sampling_power": {
      "type": "number",
      "description": "Sampling power."
    },
    "amperage": {
      "type": "number",
      "description": "Amperage."
    },
    "grd": {
      "type": "string",
      "description": "GRD (DSO) identifier."
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
      "type": "number",
      "description": "Total generating capacity."
    },
    "member_id": {
      "type": "number",
      "description": "ID of the associated member (holder)."
    },
    "sharing_operation_id": {
      "type": "number",
      "description": "ID of the associated sharing operation."
    },
    "EAN": {
      "type": "string",
      "description": "EAN Code of the meter to update."
    }
  },
  "required": [
    "EAN",
    "client_type",
    "rate",
    "start_date",
    "status"
  ],
  "additionalProperties": false,
  "description": "DTO for patching meter data configuration. Requires EAN to identify the meter to update."
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
|»» description|string|false|none|none|
|» end_date|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|»» description|string|false|none|none|
|» status|[MeterDataStatus](#schemameterdatastatus)|false|none|none|
|» rate|[MeterRate](#schemameterrate)|false|none|none|
|» client_type|[ClientType](#schemaclienttype)|false|none|none|
|» description|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» sampling_power|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» amperage|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» grd|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» injection_status|[InjectionStatus](#schemainjectionstatus)|false|none|none|
|» production_chain|[ProductionChain](#schemaproductionchain)|false|none|none|
|» total_generating_capacity|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» member_id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» sharing_operation_id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» EAN|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

<h2 id="tocS_DeleteFutureMeterDataDTO">DeleteFutureMeterDataDTO</h2>
<!-- backwards compatibility -->
<a id="schemadeletefuturemeterdatadto"></a>
<a id="schema_DeleteFutureMeterDataDTO"></a>
<a id="tocSdeletefuturemeterdatadto"></a>
<a id="tocsdeletefuturemeterdatadto"></a>

```json
{
  "type": "object",
  "properties": {
    "id_meter_data": {
      "type": "number",
      "description": "ID meter data to delete"
    },
    "active_previous_meter_data": {
      "type": "boolean",
      "description": "If true, take the previous meter data and reactive it"
    }
  },
  "required": [
    "id_meter_data"
  ],
  "additionalProperties": false,
  "description": "DTO for deleting future meter data Require ID Meter data to identify the entry to remove"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id_meter_data|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» active_previous_meter_data|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Page number to retrieve (1-based index). Defaults to 1."
    },
    "limit": {
      "type": "number",
      "description": "Number of items per page. Defaults to system configuration."
    },
    "name": {
      "type": "string",
      "description": "Filter communities by name (partial match). Must be a string if provided."
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
  ],
  "description": "DTO for querying communities with pagination and filtering."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» page|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» sort_name|[Sort](#schemasort)|false|none|none|
|» sort_id|[Sort](#schemasort)|false|none|none|
|additionalProperties|boolean|false|none|none|
|required|[string]|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Page number to retrieve (1-based index). Defaults to 1."
    },
    "limit": {
      "type": "number",
      "description": "Number of items per page. Defaults to system configuration."
    },
    "email": {
      "type": "string",
      "description": "Filter users by email (exact or partial match depending on implementation). Must be a valid email string if provided."
    },
    "role": {
      "type": "string",
      "enum": [
        "MEMBER",
        "MANAGER",
        "ADMIN"
      ],
      "description": "Enum representing user roles in the system with increasing privilege levels"
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
  ],
  "description": "DTO for querying users within a community with pagination and filtering."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» page|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» email|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» role|[Role](#schemarole)|false|none|none|
|» sort_email|[Sort](#schemasort)|false|none|none|
|» sort_id|[Sort](#schemasort)|false|none|none|
|» sort_role|[Sort](#schemasort)|false|none|none|
|additionalProperties|boolean|false|none|none|
|required|[string]|false|none|none|
|description|string|false|none|none|

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
  ],
  "description": "Enum representing user roles in the system with increasing privilege levels"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|enum|[string]|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "The unique identifier of the community (internal DB ID)."
    },
    "name": {
      "type": "string",
      "description": "The name of the community."
    }
  },
  "required": [
    "id",
    "name"
  ],
  "additionalProperties": false,
  "description": "DTO representing a simple view of a community."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "The unique identifier of the community (internal DB ID)."
    },
    "auth_community_id": {
      "type": "string",
      "description": "The unique identifier of the community in the IAM system."
    },
    "name": {
      "type": "string",
      "description": "The name of the community."
    },
    "role": {
      "type": "string",
      "enum": [
        "MEMBER",
        "MANAGER",
        "ADMIN"
      ],
      "description": "Enum representing user roles in the system with increasing privilege levels"
    }
  },
  "required": [
    "id",
    "auth_community_id",
    "name",
    "role"
  ],
  "additionalProperties": false,
  "description": "DTO representing a community from the perspective of the current user. Includes the user's role in that community."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» auth_community_id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» role|[Role](#schemarole)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "The unique identifier of the user (internal DB ID)."
    },
    "id_community": {
      "type": "number",
      "description": "The unique identifier of the community (internal DB ID)."
    },
    "email": {
      "type": "string",
      "description": "The email address of the user."
    },
    "role": {
      "type": "string",
      "enum": [
        "MEMBER",
        "MANAGER",
        "ADMIN"
      ],
      "description": "Enum representing user roles in the system with increasing privilege levels"
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
    "phone": {
      "type": [
        "string",
        "null"
      ]
    }
  },
  "required": [
    "id_user",
    "id_community",
    "email",
    "role"
  ],
  "additionalProperties": false,
  "description": "DTO representing a user's membership in a community."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id_user|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» id_community|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» email|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» role|[Role](#schemarole)|false|none|none|
|» first_name|object|false|none|none|
|»» type|[string]|false|none|none|
|» last_name|object|false|none|none|
|»» type|[string]|false|none|none|
|» phone|object|false|none|none|
|»» type|[string]|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "string",
      "description": "The name of the community. Must be a non-empty string."
    }
  },
  "required": [
    "name"
  ],
  "additionalProperties": false,
  "description": "DTO for creating or updating a community."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "The ID of the user whose role is being updated. Must be an integer."
    },
    "new_role": {
      "type": "string",
      "enum": [
        "MEMBER",
        "MANAGER",
        "ADMIN"
      ],
      "description": "Enum representing user roles in the system with increasing privilege levels"
    }
  },
  "required": [
    "id_user",
    "new_role"
  ],
  "additionalProperties": false,
  "description": "DTO for patching (updating) a user's role within a community."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id_user|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» new_role|[Role](#schemarole)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Page number to retrieve (1-based index). Defaults to 1."
    },
    "limit": {
      "type": "number",
      "description": "Number of items per page. Defaults to system configuration."
    },
    "file_name": {
      "type": "string",
      "description": "Filter documents by file name."
    },
    "file_type": {
      "type": "string",
      "description": "Filter documents by file type (MIME type)."
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
  ],
  "description": "DTO for querying and filtering documents."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» page|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» file_name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» file_type|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» sort_upload_date|[Sort](#schemasort)|false|none|none|
|» sort_file_size|[Sort](#schemasort)|false|none|none|
|additionalProperties|boolean|false|none|none|
|required|[string]|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "ID of the member who owns the document."
    },
    "file": {
      "type": "object",
      "properties": {
        "fieldname": {
          "type": "string",
          "description": "Name of the form field associated with this file."
        },
        "originalname": {
          "type": "string",
          "description": "Name of the file on the uploader's computer."
        },
        "encoding": {
          "type": "string",
          "description": "Value of the `Content-Transfer-Encoding` header for this file.",
          "deprecated": "since July 2015"
        },
        "mimetype": {
          "type": "string",
          "description": "Value of the `Content-Type` header for this file."
        },
        "size": {
          "type": "number",
          "description": "Size of the file in bytes."
        },
        "stream": {
          "type": "object",
          "properties": {
            "readable": {
              "type": "boolean",
              "description": "Is `true` if it is safe to call  {@link  read } , which means the stream has not been destroyed or emitted `'error'` or `'end'`."
            },
            "readableAborted": {
              "type": "boolean",
              "description": "Returns whether the stream was destroyed or errored before emitting `'end'`."
            },
            "readableDidRead": {
              "type": "boolean",
              "description": "Returns whether `'data'` has been emitted."
            },
            "readableEncoding": {
              "anyOf": [
                {
                  "type": "null"
                }
              ],
              "description": "Getter for the property `encoding` of a given `Readable` stream. The `encoding` property can be set using the  {@link  setEncoding }  method."
            },
            "readableEnded": {
              "type": "boolean",
              "description": "Becomes `true` when [`'end'`](https://nodejs.org/docs/latest-v25.x/api/stream.html#event-end) event is emitted."
            },
            "readableFlowing": {
              "type": [
                "boolean",
                "null"
              ],
              "description": "This property reflects the current state of a `Readable` stream as described in the [Three states](https://nodejs.org/docs/latest-v25.x/api/stream.html#three-states) section."
            },
            "readableHighWaterMark": {
              "type": "number",
              "description": "Returns the value of `highWaterMark` passed when creating this `Readable`."
            },
            "readableLength": {
              "type": "number",
              "description": "This property contains the number of bytes (or objects) in the queue ready to be read. The value provides introspection data regarding the status of the `highWaterMark`."
            },
            "readableObjectMode": {
              "type": "boolean",
              "description": "Getter for the property `objectMode` of a given `Readable` stream."
            },
            "destroyed": {
              "type": "boolean",
              "description": "Is `true` after `readable.destroy()` has been called."
            },
            "closed": {
              "type": "boolean",
              "description": "Is `true` after `'close'` has been emitted."
            },
            "errored": {
              "anyOf": [
                {
                  "type": "null"
                }
              ],
              "description": "Returns error if the stream has been destroyed with an error."
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
          "type": "string",
          "description": "`DiskStorage` only: Directory to which this file has been uploaded."
        },
        "filename": {
          "type": "string",
          "description": "`DiskStorage` only: Name of this file within `destination`."
        },
        "path": {
          "type": "string",
          "description": "`DiskStorage` only: Full path to the uploaded file."
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
      "additionalProperties": false,
      "description": "Object containing file metadata and access information."
    }
  },
  "required": [
    "id_member",
    "file"
  ],
  "additionalProperties": false,
  "description": "DTO for uploading a new document."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id_member|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» file|[global.Express.Multer.File](#schemaglobal.express.multer.file)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "string",
      "description": "The name of the file."
    },
    "fileType": {
      "type": "string",
      "description": "The MIME type of the file."
    }
  },
  "required": [
    "document",
    "fileName",
    "fileType"
  ],
  "additionalProperties": false,
  "description": "DTO representing a downloaded document."
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
|»» description|string|false|none|none|
|» fileType|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Unique identifier of the document."
    },
    "file_name": {
      "type": "string",
      "description": "Name of the file."
    },
    "file_size": {
      "type": "number",
      "description": "Size of the file in bytes."
    },
    "upload_date": {
      "type": "string",
      "format": "date-time",
      "description": "Date when the document was uploaded."
    },
    "file_type": {
      "type": "string",
      "description": "MIME type of the file."
    }
  },
  "required": [
    "id",
    "file_name",
    "file_size",
    "upload_date",
    "file_type"
  ],
  "additionalProperties": false,
  "description": "DTO exposed to the API clients representing a document."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» file_name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» file_size|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» upload_date|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|»» description|string|false|none|none|
|» file_type|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Unique identifier of the document."
    },
    "file_name": {
      "type": "string",
      "description": "Name of the file."
    },
    "file_size": {
      "type": "number",
      "description": "Size of the file in bytes."
    },
    "upload_date": {
      "type": "string",
      "format": "date-time",
      "description": "Date when the document was uploaded."
    },
    "file_type": {
      "type": "string",
      "description": "MIME type of the file."
    },
    "member_id": {
      "type": "number",
      "description": "ID of the member who owns the document."
    },
    "file_url": {
      "type": "string",
      "description": "URL of the file in the storage service."
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
  "additionalProperties": false,
  "description": "Internal DTO representing a document, including sensitive or internal fields. Extends DocumentExposedDTO."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» file_name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» file_size|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» upload_date|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|»» description|string|false|none|none|
|» file_type|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» member_id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» file_url|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

<h2 id="tocS_MeMemberPartialQuery">MeMemberPartialQuery</h2>
<!-- backwards compatibility -->
<a id="schemamememberpartialquery"></a>
<a id="schema_MeMemberPartialQuery"></a>
<a id="tocSmememberpartialquery"></a>
<a id="tocsmememberpartialquery"></a>

```json
{
  "type": "object",
  "properties": {
    "page": {
      "type": "number",
      "description": "Page number to retrieve (1-based index). Defaults to 1."
    },
    "limit": {
      "type": "number",
      "description": "Number of items per page. Defaults to system configuration."
    },
    "name": {
      "type": "string",
      "description": "Filter by member name."
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
    },
    "community_name": {
      "type": "string"
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
|»» description|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» member_type|[MemberType](#schemamembertype)|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|» sort_name|[Sort](#schemasort)|false|none|none|
|» community_name|object|false|none|none|
|»» type|string|false|none|none|
|additionalProperties|boolean|false|none|none|
|required|[string]|false|none|none|

<h2 id="tocS_MeMetersPartialQuery">MeMetersPartialQuery</h2>
<!-- backwards compatibility -->
<a id="schemamemeterspartialquery"></a>
<a id="schema_MeMetersPartialQuery"></a>
<a id="tocSmemeterspartialquery"></a>
<a id="tocsmemeterspartialquery"></a>

```json
{
  "type": "object",
  "properties": {
    "page": {
      "type": "number",
      "description": "Page number to retrieve (1-based index). Defaults to 1."
    },
    "limit": {
      "type": "number",
      "description": "Number of items per page. Defaults to system configuration."
    },
    "street": {
      "type": "string",
      "description": "Filter by street name."
    },
    "postcode": {
      "type": "number",
      "description": "Filter by postcode."
    },
    "address_number": {
      "type": "number",
      "description": "Filter by address number."
    },
    "city": {
      "type": "string",
      "description": "Filter by city name."
    },
    "supplement": {
      "type": "string",
      "description": "Filter by address supplement (box, etc.)."
    },
    "EAN": {
      "type": "string",
      "description": "Filter by EAN code."
    },
    "meter_number": {
      "type": "string",
      "description": "Filter by meter number."
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
      "type": "number",
      "description": "Filter by active sharing operation ID."
    },
    "not_sharing_operation_id": {
      "type": "number",
      "description": "Filter by explicitly NOT being in a specific sharing operation ID."
    },
    "holder_id": {
      "type": "number",
      "description": "Filter by generic member ID holder."
    },
    "community_name": {
      "type": "string"
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
|»» description|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» street|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» postcode|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» address_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» city|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» supplement|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» EAN|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» meter_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» status|[MeterDataStatus](#schemameterdatastatus)|false|none|none|
|» sharing_operation_id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» not_sharing_operation_id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» holder_id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» community_name|object|false|none|none|
|»» type|string|false|none|none|
|additionalProperties|boolean|false|none|none|
|required|[string]|false|none|none|

<h2 id="tocS_MeDocumentPartialQuery">MeDocumentPartialQuery</h2>
<!-- backwards compatibility -->
<a id="schemamedocumentpartialquery"></a>
<a id="schema_MeDocumentPartialQuery"></a>
<a id="tocSmedocumentpartialquery"></a>
<a id="tocsmedocumentpartialquery"></a>

```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "page": {
      "type": "number",
      "description": "Page number to retrieve (1-based index). Defaults to 1."
    },
    "limit": {
      "type": "number",
      "description": "Number of items per page. Defaults to system configuration."
    },
    "file_name": {
      "type": "string",
      "description": "Filter documents by file name."
    },
    "file_type": {
      "type": "string",
      "description": "Filter documents by file type (MIME type)."
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
|additionalProperties|boolean|false|none|none|
|properties|object|false|none|none|
|» page|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» file_name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» file_type|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» sort_upload_date|[Sort](#schemasort)|false|none|none|
|» sort_file_size|[Sort](#schemasort)|false|none|none|
|required|[string]|false|none|none|

<h2 id="tocS_MeMembersPartialDTO">MeMembersPartialDTO</h2>
<!-- backwards compatibility -->
<a id="schemamememberspartialdto"></a>
<a id="schema_MeMembersPartialDTO"></a>
<a id="tocSmememberspartialdto"></a>
<a id="tocsmememberspartialdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number",
      "description": "Unique ID of the member."
    },
    "name": {
      "type": "string",
      "description": "Name of the member."
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
    "community": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number",
          "description": "The unique identifier of the community (internal DB ID)."
        },
        "name": {
          "type": "string",
          "description": "The name of the community."
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false,
      "description": "DTO representing a simple view of a community."
    }
  },
  "required": [
    "community",
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
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» member_type|[MemberType](#schemamembertype)|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|» community|[CommunityDTO](#schemacommunitydto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_MeIndividualDTO">MeIndividualDTO</h2>
<!-- backwards compatibility -->
<a id="schemameindividualdto"></a>
<a id="schema_MeIndividualDTO"></a>
<a id="tocSmeindividualdto"></a>
<a id="tocsmeindividualdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number",
      "description": "Unique ID of the member."
    },
    "name": {
      "type": "string",
      "description": "Name of the member."
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
      "type": "string",
      "description": "IBAN of the member."
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
      "additionalProperties": false,
      "description": "DTO representing a full address."
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
      "additionalProperties": false,
      "description": "DTO representing a full address."
    },
    "user_link_email": {
      "type": "string",
      "description": "Linked user email, if associated with a user account."
    },
    "NRN": {
      "type": "string",
      "description": "National Registry Number."
    },
    "first_name": {
      "type": "string",
      "description": "First name."
    },
    "email": {
      "type": "string",
      "description": "Contact email."
    },
    "phone_number": {
      "type": "string",
      "description": "Phone number."
    },
    "social_rate": {
      "type": "boolean",
      "description": "Whether the social rate applies."
    },
    "manager": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number",
          "description": "Unique ID of the manager."
        },
        "NRN": {
          "type": "string",
          "description": "National Registry Number of the manager."
        },
        "name": {
          "type": "string",
          "description": "First name of the manager."
        },
        "surname": {
          "type": "string",
          "description": "Surname of the manager."
        },
        "email": {
          "type": "string",
          "description": "Email address of the manager."
        },
        "phone_number": {
          "type": "string",
          "description": "Phone number of the manager."
        }
      },
      "required": [
        "id",
        "NRN",
        "name",
        "surname",
        "email"
      ],
      "additionalProperties": false,
      "description": "DTO representing a manager associated with a member."
    },
    "community": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number",
          "description": "The unique identifier of the community (internal DB ID)."
        },
        "name": {
          "type": "string",
          "description": "The name of the community."
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false,
      "description": "DTO representing a simple view of a community."
    }
  },
  "required": [
    "NRN",
    "billing_address",
    "community",
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
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» member_type|[MemberType](#schemamembertype)|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|» iban|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» home_address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» billing_address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» user_link_email|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» NRN|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» first_name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» email|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» phone_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» social_rate|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» manager|[ManagerDTO](#schemamanagerdto)|false|none|none|
|» community|[CommunityDTO](#schemacommunitydto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_MeCompanyDTO">MeCompanyDTO</h2>
<!-- backwards compatibility -->
<a id="schemamecompanydto"></a>
<a id="schema_MeCompanyDTO"></a>
<a id="tocSmecompanydto"></a>
<a id="tocsmecompanydto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number",
      "description": "Unique ID of the member."
    },
    "name": {
      "type": "string",
      "description": "Name of the member."
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
      "type": "string",
      "description": "IBAN of the member."
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
      "additionalProperties": false,
      "description": "DTO representing a full address."
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
      "additionalProperties": false,
      "description": "DTO representing a full address."
    },
    "user_link_email": {
      "type": "string",
      "description": "Linked user email, if associated with a user account."
    },
    "vat_number": {
      "type": "string",
      "description": "VAT number of the company."
    },
    "manager": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number",
          "description": "Unique ID of the manager."
        },
        "NRN": {
          "type": "string",
          "description": "National Registry Number of the manager."
        },
        "name": {
          "type": "string",
          "description": "First name of the manager."
        },
        "surname": {
          "type": "string",
          "description": "Surname of the manager."
        },
        "email": {
          "type": "string",
          "description": "Email address of the manager."
        },
        "phone_number": {
          "type": "string",
          "description": "Phone number of the manager."
        }
      },
      "required": [
        "id",
        "NRN",
        "name",
        "surname",
        "email"
      ],
      "additionalProperties": false,
      "description": "DTO representing a manager associated with a member."
    },
    "community": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number",
          "description": "The unique identifier of the community (internal DB ID)."
        },
        "name": {
          "type": "string",
          "description": "The name of the community."
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false,
      "description": "DTO representing a simple view of a community."
    }
  },
  "required": [
    "billing_address",
    "community",
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
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» member_type|[MemberType](#schemamembertype)|false|none|none|
|» status|[MemberStatus](#schemamemberstatus)|false|none|none|
|» iban|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» home_address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» billing_address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» user_link_email|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» vat_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» manager|[ManagerDTO](#schemamanagerdto)|false|none|none|
|» community|[CommunityDTO](#schemacommunitydto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_MePartialMeterDTO">MePartialMeterDTO</h2>
<!-- backwards compatibility -->
<a id="schemamepartialmeterdto"></a>
<a id="schema_MePartialMeterDTO"></a>
<a id="tocSmepartialmeterdto"></a>
<a id="tocsmepartialmeterdto"></a>

```json
{
  "type": "object",
  "properties": {
    "EAN": {
      "type": "string",
      "description": "EAN code of the meter."
    },
    "meter_number": {
      "type": "string",
      "description": "Physical meter number."
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
      "additionalProperties": false,
      "description": "DTO representing a full address."
    },
    "holder": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number",
          "description": "Unique ID of the member."
        },
        "name": {
          "type": "string",
          "description": "Name of the member."
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
      "additionalProperties": false,
      "description": "Partial DTO representing a member (summary view)."
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
          "type": "number",
          "description": "Unique identifier."
        },
        "name": {
          "type": "string",
          "description": "Name of the sharing operation."
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
      "additionalProperties": false,
      "description": "Simplified DTO for a sharing operation (partial view), typically used in lists."
    },
    "community": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number",
          "description": "The unique identifier of the community (internal DB ID)."
        },
        "name": {
          "type": "string",
          "description": "The name of the community."
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false,
      "description": "DTO representing a simple view of a community."
    }
  },
  "required": [
    "EAN",
    "address",
    "community",
    "meter_number",
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
|»» description|string|false|none|none|
|» meter_number|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» address|[AddressDTO](#schemaaddressdto)|false|none|none|
|» holder|[MembersPartialDTO](#schemamemberspartialdto)|false|none|none|
|» status|[MeterDataStatus](#schemameterdatastatus)|false|none|none|
|» sharing_operation|[SharingOperationPartialDTO](#schemasharingoperationpartialdto)|false|none|none|
|» community|[CommunityDTO](#schemacommunitydto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_MeMeterDTO">MeMeterDTO</h2>
<!-- backwards compatibility -->
<a id="schemamemeterdto"></a>
<a id="schema_MeMeterDTO"></a>
<a id="tocSmemeterdto"></a>
<a id="tocsmemeterdto"></a>

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
      "additionalProperties": false,
      "description": "DTO representing a full address."
    },
    "holder": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number",
          "description": "Unique ID of the member."
        },
        "name": {
          "type": "string",
          "description": "Name of the member."
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
      "additionalProperties": false,
      "description": "Partial DTO representing a member (summary view)."
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
              "type": "number",
              "description": "Unique ID of the member."
            },
            "name": {
              "type": "string",
              "description": "Name of the member."
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
          "additionalProperties": false,
          "description": "Partial DTO representing a member (summary view)."
        },
        "grd": {
          "type": "string"
        },
        "sharing_operation": {
          "type": "object",
          "properties": {
            "id": {
              "type": "number",
              "description": "Unique identifier."
            },
            "name": {
              "type": "string",
              "description": "Name of the sharing operation."
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
          "additionalProperties": false,
          "description": "Simplified DTO for a sharing operation (partial view), typically used in lists."
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
      "additionalProperties": false,
      "description": "DTO representing detailed meter configuration and status for a specific period (history/current/future)."
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
                "type": "number",
                "description": "Unique ID of the member."
              },
              "name": {
                "type": "string",
                "description": "Name of the member."
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
            "additionalProperties": false,
            "description": "Partial DTO representing a member (summary view)."
          },
          "grd": {
            "type": "string"
          },
          "sharing_operation": {
            "type": "object",
            "properties": {
              "id": {
                "type": "number",
                "description": "Unique identifier."
              },
              "name": {
                "type": "string",
                "description": "Name of the sharing operation."
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
            "additionalProperties": false,
            "description": "Simplified DTO for a sharing operation (partial view), typically used in lists."
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
        "additionalProperties": false,
        "description": "DTO representing detailed meter configuration and status for a specific period (history/current/future)."
      },
      "description": "Historical meter data configurations."
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
                "type": "number",
                "description": "Unique ID of the member."
              },
              "name": {
                "type": "string",
                "description": "Name of the member."
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
            "additionalProperties": false,
            "description": "Partial DTO representing a member (summary view)."
          },
          "grd": {
            "type": "string"
          },
          "sharing_operation": {
            "type": "object",
            "properties": {
              "id": {
                "type": "number",
                "description": "Unique identifier."
              },
              "name": {
                "type": "string",
                "description": "Name of the sharing operation."
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
            "additionalProperties": false,
            "description": "Simplified DTO for a sharing operation (partial view), typically used in lists."
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
        "additionalProperties": false,
        "description": "DTO representing detailed meter configuration and status for a specific period (history/current/future)."
      },
      "description": "Future scheduled meter data configurations."
    },
    "community": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number",
          "description": "The unique identifier of the community (internal DB ID)."
        },
        "name": {
          "type": "string",
          "description": "The name of the community."
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false,
      "description": "DTO representing a simple view of a community."
    }
  },
  "required": [
    "EAN",
    "address",
    "community",
    "meter_number",
    "phases_number",
    "reading_frequency",
    "tarif_group"
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
|»» description|string|false|none|none|
|» futur_meter_data|object|false|none|none|
|»» type|string|false|none|none|
|»» items|[MetersDataDTO](#schemametersdatadto)|false|none|none|
|»» description|string|false|none|none|
|» community|[CommunityDTO](#schemacommunitydto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|

<h2 id="tocS_MeDocumentDTO">MeDocumentDTO</h2>
<!-- backwards compatibility -->
<a id="schemamedocumentdto"></a>
<a id="schema_MeDocumentDTO"></a>
<a id="tocSmedocumentdto"></a>
<a id="tocsmedocumentdto"></a>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number",
      "description": "Unique identifier of the document."
    },
    "file_name": {
      "type": "string",
      "description": "Name of the file."
    },
    "file_size": {
      "type": "number",
      "description": "Size of the file in bytes."
    },
    "upload_date": {
      "type": "string",
      "format": "date-time",
      "description": "Date when the document was uploaded."
    },
    "file_type": {
      "type": "string",
      "description": "MIME type of the file."
    },
    "community": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number",
          "description": "The unique identifier of the community (internal DB ID)."
        },
        "name": {
          "type": "string",
          "description": "The name of the community."
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false,
      "description": "DTO representing a simple view of a community."
    }
  },
  "required": [
    "community",
    "file_name",
    "file_size",
    "file_type",
    "id",
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
|»» description|string|false|none|none|
|» file_name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» file_size|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» upload_date|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|»» description|string|false|none|none|
|» file_type|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» community|[CommunityDTO](#schemacommunitydto)|false|none|none|
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
      "type": "number",
      "description": "Page number to retrieve (1-based index). Defaults to 1."
    },
    "limit": {
      "type": "number",
      "description": "Number of items per page. Defaults to system configuration."
    },
    "name": {
      "type": "string",
      "description": "Filter by member name."
    },
    "to_be_encoded": {
      "type": "boolean",
      "description": "Filter by encoding status (to be encoded or not)."
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
  ],
  "description": "DTO for querying member invitations for specific users. Supports pagination and filtering."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» page|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» to_be_encoded|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» sort_name|[Sort](#schemasort)|false|none|none|
|» sort_date|[Sort](#schemasort)|false|none|none|
|additionalProperties|boolean|false|none|none|
|required|[string]|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Unique ID of the invitation."
    },
    "member_id": {
      "type": "number",
      "description": "ID of the member (if linked/existing)."
    },
    "member_name": {
      "type": "string",
      "description": "Name of the member."
    },
    "user_email": {
      "type": "string",
      "description": "Email of the user invited."
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "Date of invitation creation."
    },
    "to_be_encoded": {
      "type": "boolean",
      "description": "Whether the member needs to be encoded (details filled)."
    },
    "community": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number",
          "description": "The unique identifier of the community (internal DB ID)."
        },
        "name": {
          "type": "string",
          "description": "The name of the community."
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false,
      "description": "DTO representing a simple view of a community."
    }
  },
  "required": [
    "id",
    "user_email",
    "created_at",
    "to_be_encoded",
    "community"
  ],
  "additionalProperties": false,
  "description": "DTO representing an invitation for a user to become a member."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» member_id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» member_name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» user_email|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» created_at|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|»» description|string|false|none|none|
|» to_be_encoded|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» community|[CommunityDTO](#schemacommunitydto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Page number to retrieve (1-based index). Defaults to 1."
    },
    "limit": {
      "type": "number",
      "description": "Number of items per page. Defaults to system configuration."
    },
    "name": {
      "type": "string",
      "description": "Filter by name."
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
  ],
  "description": "DTO for querying manager invitations."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» page|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» limit|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» name|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» sort_name|[Sort](#schemasort)|false|none|none|
|» sort_date|[Sort](#schemasort)|false|none|none|
|additionalProperties|boolean|false|none|none|
|required|[string]|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "Invitation ID."
    },
    "user_email": {
      "type": "string",
      "description": "Email of the user."
    },
    "community": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number",
          "description": "The unique identifier of the community (internal DB ID)."
        },
        "name": {
          "type": "string",
          "description": "The name of the community."
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false,
      "description": "DTO representing a simple view of a community."
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "Creation date."
    }
  },
  "required": [
    "id",
    "user_email",
    "community",
    "created_at"
  ],
  "additionalProperties": false,
  "description": "DTO representing an invitation for a user to become a manager."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» user_email|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» community|[CommunityDTO](#schemacommunitydto)|false|none|none|
|» created_at|object|false|none|none|
|»» type|string|false|none|none|
|»» format|string|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "string",
      "description": "Email of the user to invite."
    }
  },
  "required": [
    "user_email"
  ],
  "additionalProperties": false,
  "description": "DTO for sending an invitation."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» user_email|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "ID of the invitation to accept."
    }
  },
  "required": [
    "invitation_id"
  ],
  "additionalProperties": false,
  "description": "DTO for accepting an invitation."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» invitation_id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

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
      "type": "number",
      "description": "ID of the invitation to accept."
    },
    "member": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Name of the member (Full name or Company name)."
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
          "type": "string",
          "description": "IBAN of the member."
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
          "additionalProperties": false,
          "description": "DTO for creating a new address."
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
          "additionalProperties": false,
          "description": "DTO for creating a new address."
        },
        "first_name": {
          "type": "string",
          "description": "First name (Individual only)."
        },
        "NRN": {
          "type": "string",
          "description": "National Registry Number (Individual only)."
        },
        "email": {
          "type": "string",
          "description": "Contact email (Individual only)."
        },
        "phone_number": {
          "type": "string",
          "description": "Phone number (Individual only)."
        },
        "social_rate": {
          "type": "boolean",
          "description": "Social rate eligibility (Individual only)."
        },
        "vat_number": {
          "type": "string",
          "description": "VAT number (Company only)."
        },
        "manager": {
          "type": "object",
          "properties": {
            "NRN": {
              "type": "string",
              "description": "National Registry Number of the manager."
            },
            "name": {
              "type": "string",
              "description": "First name of the manager."
            },
            "surname": {
              "type": "string",
              "description": "Surname of the manager."
            },
            "email": {
              "type": "string",
              "description": "Email address of the manager."
            },
            "phone_number": {
              "type": "string",
              "description": "Phone number of the manager."
            }
          },
          "required": [
            "NRN",
            "name",
            "surname",
            "email"
          ],
          "additionalProperties": false,
          "description": "DTO representing a manager associated with a member."
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
      "additionalProperties": false,
      "description": "DTO for creating a new member. Contains common fields and type-specific fields (Individual vs Company). Uses conditional validation based on `member_type`."
    }
  },
  "required": [
    "invitation_id",
    "member"
  ],
  "additionalProperties": false,
  "description": "DTO for accepting an invitation with additional member details. Used when the member needs to be encoded/created during acceptance."
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|properties|object|false|none|none|
|» invitation_id|object|false|none|none|
|»» type|string|false|none|none|
|»» description|string|false|none|none|
|» member|[CreateMemberDTO](#schemacreatememberdto)|false|none|none|
|required|[string]|false|none|none|
|additionalProperties|boolean|false|none|none|
|description|string|false|none|none|

