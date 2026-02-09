DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

CREATE OR REPLACE FUNCTION update_changetimestamp_column()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE IF NOT EXISTS COMMUNITY(
                                        id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                        name VARCHAR(255) NOT NULL UNIQUE,
    auth_community_id VARCHAR(255) UNIQUE, -- External Auth provider link
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
CREATE TRIGGER update_community_modtime
    BEFORE UPDATE ON COMMUNITY
    FOR EACH ROW
    EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS ADDRESS(
                                      id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                      street VARCHAR(255) NOT NULL,
    number INT NOT NULL,
    postcode VARCHAR(255) NOT NULL,
    supplement VARCHAR(255),
    city VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_community INT NULL REFERENCES COMMUNITY(id) ON DELETE SET NULL
    );
CREATE INDEX idx_address_community ON ADDRESS(id_community);

CREATE TRIGGER update_address_modtime
    BEFORE UPDATE ON ADDRESS
    FOR EACH ROW
    EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS ALLOCATION_KEY
(
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_community INT NOT NULL REFERENCES COMMUNITY(id) ON DELETE CASCADE
    );
CREATE INDEX idx_key_community ON ALLOCATION_KEY(id_community);

CREATE TRIGGER update_key_modtime
    BEFORE UPDATE ON ALLOCATION_KEY
    FOR EACH ROW
    EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS ITERATION
(
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    number int NOT NULL,
    energy_allocated_percentage float NOT NULL,
    id_key int NOT NULL REFERENCES ALLOCATION_KEY(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_community INT NOT NULL REFERENCES COMMUNITY(id) ON DELETE CASCADE
    );
CREATE INDEX idx_iteration_key ON ITERATION(id_key);
CREATE INDEX idx_iteration_community ON ITERATION(id_community);

CREATE TRIGGER update_iteration_modtime
    BEFORE UPDATE ON ITERATION
    FOR EACH ROW
    EXECUTE FUNCTION update_changetimestamp_column();


CREATE TABLE IF NOT EXISTS CONSUMER(
   id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
   name varchar(255) NOT NULL,
    energy_allocated_percentage float NOT NULL,
    id_iteration int NOT NULL REFERENCES ITERATION(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_community INT NOT NULL REFERENCES COMMUNITY(id) ON DELETE CASCADE
    );
CREATE INDEX idx_consumer_iteration ON Consumer(id_iteration);
CREATE INDEX idx_consumer_community ON CONSUMER(id_community);

CREATE TRIGGER update_consumer_modtime
    BEFORE UPDATE ON CONSUMER
    FOR EACH ROW
    EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS MEMBER(
                                     id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY UNIQUE,
                                     name VARCHAR(255) NOT NULL,
    id_home_address INT NOT NULL,
    FOREIGN KEY (id_home_address) REFERENCES ADDRESS(id) ON DELETE CASCADE,
    id_billing_address INT NOT NULL,
    FOREIGN KEY (id_billing_address) REFERENCES ADDRESS(id) ON DELETE CASCADE,
    IBAN VARCHAR(255) NOT NULL,
    STATUS INT NOT NULL CHECK (STATUS IN (1, 2, 3)), -- 1: Active; 2: Inactive; 3: Pending
    member_type INT NOT NULL CHECK (member_type IN (1, 2)), -- 1: Individuals; 2: Company
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_community INT NOT NULL REFERENCES COMMUNITY(id) ON DELETE CASCADE
    );
CREATE INDEX idx_member_home_addr ON MEMBER(id_home_address);
CREATE INDEX idx_member_billing_addr on MEMBER(id_billing_address);
CREATE INDEX idx_member_community ON MEMBER(id_community);

CREATE TRIGGER update_members_modtime
    BEFORE UPDATE ON MEMBER
    FOR EACH ROW
    EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS MANAGER(
                                      id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY UNIQUE,
                                      NRN VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    surname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_community INT NOT NULL REFERENCES COMMUNITY(id) ON DELETE CASCADE
    );
CREATE INDEX idx_manager_community ON MANAGER(id_community);

CREATE TRIGGER update_managers_modtime
    BEFORE UPDATE ON MANAGER
    FOR EACH ROW
    EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS INDIVIDUAL(
                                         id INT PRIMARY KEY REFERENCES MEMBER(id) ON DELETE CASCADE, -- Same ID as MEMBER
    first_name VARCHAR(255) NOT NULL,
    NRN VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(255),
    social_rate boolean NOT NULL DEFAULT FALSE,
    id_manager INT NULL REFERENCES MANAGER(ID)
    );

CREATE INDEX idx_individual_manager ON INDIVIDUAL(id_manager);

CREATE TABLE IF NOT EXISTS COMPANY(
                                      id INT PRIMARY KEY REFERENCES MEMBER(id) ON DELETE CASCADE, -- Same ID as MEMBER
    vat_number VARCHAR(255) NOT NULL,
    id_manager INT NOT NULL REFERENCES MANAGER(ID)
    );
CREATE INDEX idx_companies_manager ON COMPANY(id_manager);


CREATE TABLE IF NOT EXISTS DOCUMENT(
                                       id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                       id_member INT NOT NULL REFERENCES MEMBER(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    file_type VARCHAR(255) NOT NULL,
    upload_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_community INT NOT NULL REFERENCES COMMUNITY(id) ON DELETE CASCADE
    );
CREATE INDEX document_member ON DOCUMENT(id_member);
CREATE INDEX idx_document_community ON DOCUMENT(id_community);

CREATE TRIGGER update_document_modtime
    BEFORE UPDATE ON DOCUMENT
    FOR EACH ROW
    EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS METER(
                                    EAN VARCHAR PRIMARY KEY,
                                    meter_number VARCHAR(255) NOT NULL,
    id_address INT NOT NULL REFERENCES ADDRESS(id),
    tarif_group INT NOT NULL CHECK (tarif_group IN (1, 2)), -- 1: Low tension ; 2: High tension
    phases_number INT NOT NULL,
    reading_frequency INT NOT NULL CHECK (reading_frequency IN (1 ,2)), -- 1 : Monthly, 2 : Yearly
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_community INT NOT NULL REFERENCES COMMUNITY(id) ON DELETE CASCADE
    );
CREATE INDEX idx_meter_community ON METER(id_community);

CREATE INDEX idx_meters_address ON METER(id_address);
CREATE TRIGGER update_meters_modtime
    BEFORE UPDATE ON METER
    FOR EACH ROW
    EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS SHARING_OPERATION(
                                                id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                                name VARCHAR(255) NOT NULL,
    type INT NOT NULL CHECK (type IN (1, 2, 3)), -- 1: Local 2: CER 3: CEC
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_community INT NOT NULL REFERENCES COMMUNITY(id) ON DELETE CASCADE
    );
CREATE INDEX idx_sharing_operation_community ON SHARING_OPERATION(id_community);

CREATE TRIGGER update_sharing_operation_modtime
    BEFORE UPDATE ON SHARING_OPERATION
    FOR EACH ROW
    EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS SHARING_OPERATION_KEY(
                                                    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                                    id_sharing_operation INT NOT NULL REFERENCES SHARING_OPERATION(id) ON DELETE CASCADE,
    id_key INT NOT NULL REFERENCES ALLOCATION_KEY(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    status INT NOT NULL CHECK (status IN (1, 2, 3)), -- 1: Approved; 2: Pending; 3: Rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_community INT NOT NULL REFERENCES COMMUNITY(id) ON DELETE CASCADE
    );
CREATE INDEX idx_sharing_operation_key_sharing_op ON SHARING_OPERATION_KEY(id_sharing_operation);
CREATE INDEX idx_sharing_operation_key_key ON SHARING_OPERATION_KEY(id_key);
CREATE INDEX idx_sharing_operation_key_community ON SHARING_OPERATION_KEY(id_community);
CREATE TRIGGER update_sharing_operation_key_modtime
    BEFORE UPDATE ON SHARING_OPERATION_KEY
    FOR EACH ROW
    EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS METER_DATA(
                                         id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                         description TEXT,
                                         ean VARCHAR(255) NOT NULL references METER(EAN) ON DELETE CASCADE,
    status INT NOT NULL CHECK (status IN (1, 2, 3, 4)), -- 1: Active; 2: Inactive; 3: Waiting confirmation from GRD, 4: Waiting confirmation from manager
    sampling_power FLOAT,
    amperage FLOAT,
    rate int NOT NULL CHECK (rate IN (1, 2, 3)), -- 1: Simple ; 2: Bi-horaire; 3: Exclusif nuit
    client_type INT NOT NULL CHECK (client_type IN (1, 2, 3)), -- 1: Résidentiel; 2: Professionnel; 3: Industriel
    id_member INT REFERENCES MEMBER(id) ON DELETE SET NULL, -- TODO: Is that the right way ?
    start_date DATE NOT NULL,
    end_date DATE,
    injection_status INT CHECK (injection_status IN (1, 2, 3, 4)), -- 1: Autoproducteur propriétaire; 2: Autorpoducteur droit de jouissance; 3: Injection pure propriétaire; 4: Injection pure droit de jouissance
    production_chain INT CHECK (production_chain IN (1, 2, 3 ,4 ,5 ,6, 7)), -- 1: Photovoltaique; 2: éolien; 3: hydroélectrique; 4: biomasse solide ; 5 : biogaz; 6: cogénération fossile; 7: autre
    total_generating_capacity FLOAT,
    grd VARCHAR(255),
    id_sharing_operation INT REFERENCES SHARING_OPERATION(id)  ON DELETE SET NULL, -- TODO: Is that the right way ?
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_community INT NOT NULL REFERENCES COMMUNITY(id) ON DELETE CASCADE
    );
CREATE INDEX idx_meter_data_meter ON METER_DATA(ean);
CREATE INDEX idx_meter_data_sharing_operation ON METER_DATA(id_sharing_operation);
CREATE INDEX idx_meter_data_member ON METER_DATA(id_member);
CREATE INDEX idx_meter_data_community ON METER_DATA(id_community);

CREATE TRIGGER update_meter_data_modtime
    BEFORE UPDATE ON METER_DATA
    FOR EACH ROW
    EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS METER_CONSUMPTION (
                                                 id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                                 ean VARCHAR(255) NOT NULL references METER(EAN) ON DELETE CASCADE,
    id_sharing_operation INTEGER references SHARING_OPERATION(id),
    timestamp TIMESTAMPTZ NOT NULL,
    gross FLOAT,
    net FLOAT,
    shared FLOAT,
    inj_gross FLOAT,
    inj_shared FLOAT,
    inj_net FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_community INT NOT NULL REFERENCES COMMUNITY(id) ON DELETE CASCADE
    );
CREATE INDEX idx_meter_consumption_meter ON METER_CONSUMPTION(ean);
CREATE INDEX idx_meter_consumption_sharing_operation ON METER_CONSUMPTION(id_sharing_operation);
CREATE INDEX idx_meter_consumption_community ON METER_CONSUMPTION(id_community);

CREATE TRIGGER update_meter_consumption_modtime
    BEFORE UPDATE ON METER_CONSUMPTION
    FOR EACH ROW
    EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS SHARING_OP_CONSUMPTION (
                                                      id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                                      id_sharing_operation INTEGER NOT NULL REFERENCES SHARING_OPERATION(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    gross FLOAT,
    net FLOAT,
    shared FLOAT,
    inj_gross FLOAT,
    inj_shared FLOAT,
    inj_net FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_community INT NOT NULL REFERENCES COMMUNITY(id) ON DELETE CASCADE
    );
CREATE INDEX idx_sharing_op_consumption_sharing_op ON SHARING_OP_CONSUMPTION(id_sharing_operation);
CREATE INDEX idx_sharing_op_consumption_community ON SHARING_OP_CONSUMPTION(id_community);

CREATE TRIGGER update_sharing_op_consumption_modtime
    BEFORE UPDATE ON SHARING_OP_CONSUMPTION
    FOR EACH ROW
    EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS "user"(
                                     id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                     email TEXT UNIQUE NOT NULL,
                                     first_name TEXT NULL,
                                     last_name TEXT NULL,
                                     NRN TEXT NULL,
                                     phone_number TEXT NULL,
                                     iban TEXT NULL,
                                     id_home_address INT,
                                     FOREIGN KEY (id_home_address) REFERENCES ADDRESS(id),
    id_billing_address INT,
    FOREIGN KEY (id_billing_address) REFERENCES ADDRESS(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    auth_user_id VARCHAR(255) UNIQUE -- External Auth provider link
    );
CREATE INDEX idx_home_addr_user ON "user"(id_home_address);
CREATE INDEX idx_billing_addr_user on "user"(id_billing_address);
CREATE TRIGGER update_user_modtime
    BEFORE UPDATE ON "user"
    FOR EACH ROW
    EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS COMMUNITY_USER(
                                             id_community INTEGER REFERENCES COMMUNITY(id) ON DELETE CASCADE,
    id_user INTEGER REFERENCES "user" (id) ON DELETE CASCADE,
    role VARCHAR(50) CHECK (role in ('ADMIN', 'MANAGER', 'MEMBER')), -- (String matches IAM role name)

    PRIMARY KEY (id_community, id_user)
    );
CREATE INDEX idx_community_user_community ON COMMUNITY_USER(id_community);
CREATE INDEX idx_community_user_user ON COMMUNITY_USER(id_user);


CREATE TABLE IF NOT EXISTS User_Member_Link (
                                                id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                                id_user INT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,        -- references User.id
    id_member INT NOT NULL REFERENCES MEMBER(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
CREATE INDEX idx_user_member_link_user ON User_Member_Link(id_user);
CREATE INDEX idx_user_member_link_member on User_Member_Link(id_member);
CREATE TRIGGER update_user_member_link_modtime
    BEFORE UPDATE ON User_Member_Link
    FOR EACH ROW
    EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS User_Member_Invitation(
                                                     id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                                     member_id INT REFERENCES MEMBER(id) ON DELETE CASCADE,
    member_name TEXT,
    user_email TEXT,       -- The invitee's email
    id_user INT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    to_be_encoded boolean NOT NULL DEFAULT FALSE, -- True if invitation, false if member added and invitation automatically created
    id_community INT REFERENCES COMMUNITY(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
CREATE INDEX idx_user_member_invitation_community ON User_Member_Invitation(id_community);
CREATE INDEX idx_user_member_invitation_user ON User_Member_Invitation(id_user);
CREATE INDEX idx_user_member_invitation_member ON User_Member_Invitation(member_id);
CREATE TRIGGER update_user_member_invitation_modtime
    BEFORE UPDATE ON User_Member_Invitation
    FOR EACH ROW
    EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS Gestionnaire_Invitation(
                                                      id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                                      user_email TEXT NOT NULL,
                                                      id_user INT REFERENCES "user"(ID),
    id_community INT NOT NULL REFERENCES community(id)  ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX idx_gestionnaire_invitation_user ON Gestionnaire_Invitation(id_user);
CREATE INDEX idx_gestionnaire_invitation_community ON Gestionnaire_Invitation(id_community);
CREATE TRIGGER update_gestionnaire_invitation_modtime
    BEFORE UPDATE ON Gestionnaire_Invitation
    FOR EACH ROW
    EXECUTE FUNCTION update_changetimestamp_column();



-- --- MOCK DATA ---

-- 1. Communities
INSERT INTO COMMUNITY (name, auth_community_id) VALUES ('Test Community', '1');
INSERT INTO COMMUNITY (name, auth_community_id) VALUES ('Other Community', '2');

-- 2. Addresses
INSERT INTO ADDRESS (street, number, postcode, city, id_community) VALUES ( 'Main St', 1, '1000', 'Brussels', 1);
INSERT INTO ADDRESS (street, number, postcode, city, id_community) VALUES ( 'Second St', 2, '2000', 'Antwerp', 1);
INSERT INTO ADDRESS (street, number, postcode, city, id_community) VALUES ( 'Third St', 3, '3000', 'Leuven', 2);
INSERT INTO ADDRESS (street, number, postcode, city, id_community) VALUES ( 'Fourth St', 4, '4000', 'Liege', 1);

-- 3. Users
INSERT INTO "user" (email, first_name, last_name, auth_user_id, id_home_address, id_billing_address)
VALUES ('admin@test.com', 'Admin', 'User', 'auth0|admin', 1, 1);
INSERT INTO "user" (email, first_name, last_name, auth_user_id, id_home_address, id_billing_address)
VALUES ('manager@test.com', 'Manager', 'User', 'auth0|manager', 2, 2);
INSERT INTO "user" (email, first_name, last_name, auth_user_id, id_home_address, id_billing_address)
VALUES ('member@test.com', 'Member', 'User', 'auth0|member', 1, 1);

-- 4. Community Users (Roles)
INSERT INTO COMMUNITY_USER (id_community, id_user, role) VALUES (1, 1, 'ADMIN');
INSERT INTO COMMUNITY_USER (id_community, id_user, role) VALUES (1, 2, 'MANAGER');
INSERT INTO COMMUNITY_USER (id_community, id_user, role) VALUES (1, 3, 'MEMBER');

-- 5. Members (Base)
INSERT INTO MEMBER (name, id_home_address, id_billing_address, IBAN, STATUS, member_type, id_community)
VALUES ('Member One', 1, 1, 'BE1234567890', 1, 1, 1); -- Individual
INSERT INTO MEMBER (name, id_home_address, id_billing_address, IBAN, STATUS, member_type, id_community)
VALUES ('Member Two', 2, 2, 'BE0987654321', 1, 2, 1); -- Company
INSERT INTO MEMBER (name, id_home_address, id_billing_address, IBAN, STATUS, member_type, id_community)
VALUES ('Member Three', 3, 3, 'BE1122334455', 1, 1, 2); -- Other community

-- 6. Managers (for Entities)
INSERT INTO MANAGER (NRN, name, surname, email, phone_number, id_community)
VALUES ('123456789', 'Manager', 'One', 'mgr1@test.com', '0470000000', 1);

-- 7. Individual / Company Details
INSERT INTO INDIVIDUAL (id, first_name, NRN, email, phone_number, social_rate, id_manager)
VALUES (1, 'John', '111111111', 'john@test.com', '0471111111', false, 1);

INSERT INTO COMPANY (id, vat_number, id_manager)
VALUES (2, 'BE0000000000', 1);

-- 8. Allocation Keys
INSERT INTO ALLOCATION_KEY (name, description, id_community) VALUES ('Key 1', 'Desc 1', 1);
INSERT INTO ALLOCATION_KEY (name, description, id_community) VALUES ('Key 2', 'Desc 2', 1);

-- 9. Iterations & Consumers
INSERT INTO ITERATION (number, energy_allocated_percentage, id_key, id_community) VALUES (1, 1.0, 1, 1);
INSERT INTO CONSUMER (name, energy_allocated_percentage, id_iteration, id_community) VALUES ('Consumer 1', 0.5, 1, 1);
INSERT INTO CONSUMER (name, energy_allocated_percentage, id_iteration, id_community) VALUES ('Consumer 2', 0.5, 1, 1);

-- 10. Meters
INSERT INTO METER (EAN, meter_number, id_address, tarif_group, phases_number, reading_frequency, id_community)
VALUES ('123456789012345678', 'M1', 1, 1, 1, 1, 1);
INSERT INTO METER (EAN, meter_number, id_address, tarif_group, phases_number, reading_frequency, id_community)
VALUES ('987654321098765432', 'M2', 2, 1, 3, 1, 1);

-- 11. Sharing Operations
INSERT INTO SHARING_OPERATION (name, type, id_community) VALUES ('Op 1', 1, 1);
INSERT INTO SHARING_OPERATION ( name, type, id_community) VALUES ('Op 2', 2, 1);

-- 12. Sharing Operation Key Links
INSERT INTO SHARING_OPERATION_KEY (id_sharing_operation, id_key, start_date, status, id_community)
VALUES (1, 1, '2024-01-01', 1, 1); -- Active
INSERT INTO SHARING_OPERATION_KEY (id_sharing_operation, id_key, start_date, status, id_community)
VALUES (2, 2, '2024-01-01', 2, 1); -- Pending

-- 13. Meter Data (Configuration)
INSERT INTO METER_DATA (ean, status, rate, client_type, start_date, id_sharing_operation, id_community, id_member, injection_status, production_chain, total_generating_capacity)
VALUES ('123456789012345678', 1, 1, 1, '2024-01-01', 1, 1, 1, 1, 1, 5.0); -- Active, Simple, Res, Op1, Member1, Prod Owner, PV, 5kVA

INSERT INTO METER_DATA (ean, status, rate, client_type, start_date, id_sharing_operation, id_community, id_member, injection_status, production_chain, total_generating_capacity)
VALUES ('987654321098765432', 3, 2, 2, '2024-01-01', 2, 1, 2, null, null, null); -- Waiting GRD, Bi-horaire, Pro, Op2, Member2

-- 14. Documents
INSERT INTO DOCUMENT (id_member, file_name, file_url, file_size, file_type, upload_date, id_community)
VALUES (1, 'doc.pdf', 'http://url', 100, 'application/pdf', '2024-01-01', 1);

-- 15. User Member Links
INSERT INTO User_Member_Link (id_user, id_member, created_at) VALUES (3, 1, '2024-01-01');

-- 16. User Member Invitations
INSERT INTO User_Member_Invitation (member_id, member_name, user_email, to_be_encoded, id_community)
VALUES (2, 'Member Two', 'invitee@test.com', false, 1);

-- 17. Gestionnaire Invitations
INSERT INTO Gestionnaire_Invitation (user_email, id_community) VALUES ('future_admin@test.com', 1);

-- 18. Meter Local Consumption (15min data)
INSERT INTO METER_CONSUMPTION (ean, id_sharing_operation, timestamp, gross, net, shared, id_community)
VALUES ('123456789012345678', 1, '2024-01-01 12:00:00+00', 1.0, 0.8, 0.2, 1);

-- 19. Sharing Op Aggregated Consumption
INSERT INTO SHARING_OP_CONSUMPTION (id_sharing_operation, timestamp, gross, net, shared, id_community)
VALUES (1, '2024-01-01 12:00:00+00', 10.0, 8.0, 2.0, 1);

-- Reset Sequences to avoid collisions with hardcoded IDs
ALTER TABLE COMMUNITY ALTER COLUMN id RESTART WITH 10;
ALTER TABLE ADDRESS ALTER COLUMN id RESTART WITH 10;
ALTER TABLE "user" ALTER COLUMN id RESTART WITH 10;
ALTER TABLE MEMBER ALTER COLUMN id RESTART WITH 10;
ALTER TABLE ALLOCATION_KEY ALTER COLUMN id RESTART WITH 10;
ALTER TABLE SHARING_OPERATION ALTER COLUMN id RESTART WITH 10;
ALTER TABLE ITERATION ALTER COLUMN id RESTART WITH 10;
ALTER TABLE CONSUMER ALTER COLUMN id RESTART WITH 10;
