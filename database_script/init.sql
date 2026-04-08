DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

CREATE OR REPLACE FUNCTION update_changetimestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS community (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    website_url VARCHAR(255) NULL,
    logo_url VARCHAR(255) NULL,
    description TEXT NULL,
    headquarters_address_id INTEGER NULL,
    auth_community_id VARCHAR(255) UNIQUE, -- External Auth provider link
    created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp
);
CREATE TRIGGER update_community_modtime
BEFORE UPDATE ON community
FOR EACH ROW
EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS address (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    street VARCHAR(255) NOT NULL,
    number INT NOT NULL,
    postcode VARCHAR(255) NOT NULL,
    supplement VARCHAR(255),
    city VARCHAR(255) NOT NULL,
    id_community INT REFERENCES community (id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp
);

ALTER TABLE community ADD CONSTRAINT fk_community_headquarters_address FOREIGN KEY (
    headquarters_address_id
) REFERENCES address (id);

CREATE TRIGGER update_address_modtime
BEFORE UPDATE ON address
FOR EACH ROW
EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS allocation_key
(
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
    id_community INT NOT NULL REFERENCES community (id) ON DELETE CASCADE
);
CREATE INDEX idx_key_community ON allocation_key (id_community);

CREATE TRIGGER update_key_modtime
BEFORE UPDATE ON allocation_key
FOR EACH ROW
EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS iteration
(
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    number INT NOT NULL,
    energy_allocated_percentage FLOAT NOT NULL,
    id_key INT NOT NULL REFERENCES allocation_key (id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
    id_community INT NOT NULL REFERENCES community (id) ON DELETE CASCADE
);
CREATE INDEX idx_iteration_key ON iteration (id_key);
CREATE INDEX idx_iteration_community ON iteration (id_community);

CREATE TRIGGER update_iteration_modtime
BEFORE UPDATE ON iteration
FOR EACH ROW
EXECUTE FUNCTION update_changetimestamp_column();


CREATE TABLE IF NOT EXISTS consumer (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    energy_allocated_percentage FLOAT NOT NULL,
    id_iteration INT NOT NULL REFERENCES iteration (id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
    id_community INT NOT NULL REFERENCES community (id) ON DELETE CASCADE
);
CREATE INDEX idx_consumer_iteration ON consumer (id_iteration);
CREATE INDEX idx_consumer_community ON consumer (id_community);

CREATE TRIGGER update_consumer_modtime
BEFORE UPDATE ON consumer
FOR EACH ROW
EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS member (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY UNIQUE,
    name VARCHAR(255) NOT NULL,
    id_home_address INT NOT NULL,
    FOREIGN KEY (id_home_address) REFERENCES address (id) ON DELETE CASCADE,
    id_billing_address INT NOT NULL,
    FOREIGN KEY (id_billing_address) REFERENCES address (id) ON DELETE CASCADE,
    iban VARCHAR(255) NOT NULL,
    -- 1: Active; 2: Inactive; 3: Pending
    status INT NOT NULL CHECK (status IN (1, 2, 3)),
    -- 1: Individuals; 2: Company
    member_type INT NOT NULL CHECK (member_type IN (1, 2)),
    created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp,
    id_community INT NOT NULL REFERENCES community (id) ON DELETE CASCADE
);
CREATE INDEX idx_member_home_addr ON member (id_home_address);
CREATE INDEX idx_member_billing_addr ON member (id_billing_address);
CREATE INDEX idx_member_community ON member (id_community);

CREATE TRIGGER update_members_modtime
BEFORE UPDATE ON member
FOR EACH ROW
EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS manager (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY UNIQUE,
    nrn VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    surname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(255),
    created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp,
    id_community INT NOT NULL REFERENCES community (id) ON DELETE CASCADE
);
CREATE INDEX idx_manager_community ON manager (id_community);

CREATE TRIGGER update_managers_modtime
BEFORE UPDATE ON manager
FOR EACH ROW
EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS individual (
    -- Same ID as MEMBER
    id INT PRIMARY KEY REFERENCES member (id) ON DELETE CASCADE,
    first_name VARCHAR(255) NOT NULL,
    nrn VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(255),
    social_rate BOOLEAN NOT NULL DEFAULT FALSE,
    id_manager INT NULL REFERENCES manager (id)
);

CREATE INDEX idx_individual_manager ON individual (id_manager);

CREATE TABLE IF NOT EXISTS company (
    -- Same ID as MEMBER
    id INT PRIMARY KEY REFERENCES member (id) ON DELETE CASCADE,
    vat_number VARCHAR(255) NOT NULL,
    id_manager INT NOT NULL REFERENCES manager (id)
);
CREATE INDEX idx_companies_manager ON company (id_manager);


CREATE TABLE IF NOT EXISTS document (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_member INT NOT NULL REFERENCES member (id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    file_type VARCHAR(255) NOT NULL,
    upload_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp,
    id_community INT NOT NULL REFERENCES community (id) ON DELETE CASCADE
);
CREATE INDEX document_member ON document (id_member);
CREATE INDEX idx_document_community ON document (id_community);

CREATE TRIGGER update_document_modtime
BEFORE UPDATE ON document
FOR EACH ROW
EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS meter (
    ean VARCHAR PRIMARY KEY,
    meter_number VARCHAR(255) NOT NULL,
    id_address INT NOT NULL REFERENCES address (id),
    -- 1: Low tension ; 2: High tension
    tarif_group INT NOT NULL CHECK (tarif_group IN (1, 2)),
    phases_number INT NOT NULL,
    -- 1 : Monthly, 2 : Yearly
    reading_frequency INT NOT NULL CHECK (reading_frequency IN (1, 2)),
    created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp,
    id_community INT NOT NULL REFERENCES community (id) ON DELETE CASCADE
);
CREATE INDEX idx_meter_community ON meter (id_community);

CREATE INDEX idx_meters_address ON meter (id_address);
CREATE TRIGGER update_meters_modtime
BEFORE UPDATE ON meter
FOR EACH ROW
EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS sharing_operation (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type INT NOT NULL CHECK (type IN (1, 2, 3)), -- 1: Local 2: CER 3: CEC
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp,
    id_community INT NOT NULL REFERENCES community (id) ON DELETE CASCADE
);
CREATE INDEX idx_sharing_operation_community ON sharing_operation (
    id_community
);

CREATE TRIGGER update_sharing_operation_modtime
BEFORE UPDATE ON sharing_operation
FOR EACH ROW
EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS sharing_operation_key (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_sharing_operation INT NOT NULL REFERENCES sharing_operation (
        id
    ) ON DELETE CASCADE,
    id_key INT NOT NULL REFERENCES allocation_key (id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    -- 1: Approved; 2: Pending; 3: Rejected
    status INT NOT NULL CHECK (status IN (1, 2, 3)),
    created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp,
    id_community INT NOT NULL REFERENCES community (id) ON DELETE CASCADE
);
CREATE INDEX idx_sharing_operation_key_sharing_op ON sharing_operation_key (
    id_sharing_operation
);
CREATE INDEX idx_sharing_operation_key_key ON sharing_operation_key (id_key);
CREATE INDEX idx_sharing_operation_key_community ON sharing_operation_key (
    id_community
);
CREATE TRIGGER update_sharing_operation_key_modtime
BEFORE UPDATE ON sharing_operation_key
FOR EACH ROW
EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS meter_data (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    description TEXT,
    ean VARCHAR(255) NOT NULL REFERENCES meter (ean) ON DELETE CASCADE,
    status INT NOT NULL CHECK (status IN (1, 2, 3, 4)), -- 1: Active; 2: Inactive; 3: Waiting confirmation from GRD, 4: Waiting confirmation from manager
    sampling_power FLOAT,
    amperage FLOAT,
    -- 1: Simple ; 2: Bi-horaire; 3: Exclusif nuit
    rate INT NOT NULL CHECK (rate IN (1, 2, 3)),
    -- 1: Résidentiel; 2: Professionnel; 3: Industriel
    client_type INT NOT NULL CHECK (client_type IN (1, 2, 3)),
    -- TODO: Is that the right way ?
    id_member INT REFERENCES member (id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    injection_status INT CHECK (injection_status IN (1, 2, 3, 4)), -- 1: Autoproducteur propriétaire; 2: Autorpoducteur droit de jouissance; 3: Injection pure propriétaire; 4: Injection pure droit de jouissance
    production_chain INT CHECK (production_chain IN (1, 2, 3, 4, 5, 6, 7)), -- 1: Photovoltaique; 2: éolien; 3: hydroélectrique; 4: biomasse solide ; 5 : biogaz; 6: cogénération fossile; 7: autre
    total_generating_capacity FLOAT,
    grd VARCHAR(255),
    -- TODO: Is that the right way ?
    id_sharing_operation INT REFERENCES sharing_operation (
        id
    ) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp,
    id_community INT NOT NULL REFERENCES community (id) ON DELETE CASCADE
);
CREATE INDEX idx_meter_data_meter ON meter_data (ean);
CREATE INDEX idx_meter_data_sharing_operation ON meter_data (
    id_sharing_operation
);
CREATE INDEX idx_meter_data_member ON meter_data (id_member);
CREATE INDEX idx_meter_data_community ON meter_data (id_community);

CREATE TRIGGER update_meter_data_modtime
BEFORE UPDATE ON meter_data
FOR EACH ROW
EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS meter_consumption (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ean VARCHAR(255) NOT NULL REFERENCES meter (ean) ON DELETE CASCADE,
    id_sharing_operation INTEGER REFERENCES sharing_operation (id),
    timestamp TIMESTAMPTZ NOT NULL,
    gross FLOAT,
    net FLOAT,
    shared FLOAT,
    inj_gross FLOAT,
    inj_shared FLOAT,
    inj_net FLOAT,
    created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp,
    id_community INT NOT NULL REFERENCES community (id) ON DELETE CASCADE
);
CREATE INDEX idx_meter_consumption_meter ON meter_consumption (ean);
CREATE INDEX idx_meter_consumption_sharing_operation ON meter_consumption (
    id_sharing_operation
);
CREATE INDEX idx_meter_consumption_community ON meter_consumption (
    id_community
);

CREATE TRIGGER update_meter_consumption_modtime
BEFORE UPDATE ON meter_consumption
FOR EACH ROW
EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS sharing_op_consumption (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_sharing_operation INTEGER NOT NULL REFERENCES sharing_operation (
        id
    ) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    gross FLOAT,
    net FLOAT,
    shared FLOAT,
    inj_gross FLOAT,
    inj_shared FLOAT,
    inj_net FLOAT,
    created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp,
    id_community INT NOT NULL REFERENCES community (id) ON DELETE CASCADE
);
CREATE INDEX idx_sharing_op_consumption_sharing_op ON sharing_op_consumption (
    id_sharing_operation
);
CREATE INDEX idx_sharing_op_consumption_community ON sharing_op_consumption (
    id_community
);

CREATE TRIGGER update_sharing_op_consumption_modtime
BEFORE UPDATE ON sharing_op_consumption
FOR EACH ROW
EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS app_user (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NULL,
    last_name TEXT NULL,
    nrn TEXT NULL,
    phone_number TEXT NULL,
    iban TEXT NULL,
    id_home_address INT,
    FOREIGN KEY (id_home_address) REFERENCES address (id),
    id_billing_address INT,
    FOREIGN KEY (id_billing_address) REFERENCES address (id),
    created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp,
    auth_user_id VARCHAR(255) UNIQUE -- External Auth provider link
);
CREATE INDEX idx_home_addr_user ON app_user (id_home_address);
CREATE INDEX idx_billing_addr_user ON app_user (id_billing_address);
CREATE TRIGGER update_user_modtime
BEFORE UPDATE ON app_user
FOR EACH ROW
EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS community_user (
    id_community INTEGER REFERENCES community (id) ON DELETE CASCADE,
    id_user INTEGER REFERENCES app_user (id) ON DELETE CASCADE,
    -- (String matches IAM role name)
    role VARCHAR(50) CHECK (role IN ('ADMIN', 'MANAGER', 'MEMBER')),

    PRIMARY KEY (id_community, id_user)
);
CREATE INDEX idx_community_user_community ON community_user (id_community);
CREATE INDEX idx_community_user_user ON community_user (id_user);


CREATE TABLE IF NOT EXISTS user_member_link (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- references User.id
    id_user INT NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    id_member INT NOT NULL REFERENCES member (id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp
);
CREATE INDEX idx_user_member_link_user ON user_member_link (id_user);
CREATE INDEX idx_user_member_link_member ON user_member_link (id_member);
CREATE TRIGGER update_user_member_link_modtime
BEFORE UPDATE ON user_member_link
FOR EACH ROW
EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS user_member_invitation (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    member_id INT REFERENCES member (id) ON DELETE CASCADE,
    member_name TEXT,
    user_email TEXT,       -- The invitee's email
    id_user INT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    to_be_encoded BOOLEAN NOT NULL DEFAULT FALSE, -- True if invitation, false if member added and invitation automatically created
    id_community INT REFERENCES community (id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp
);
CREATE INDEX idx_user_member_invitation_community ON user_member_invitation (
    id_community
);
CREATE INDEX idx_user_member_invitation_user ON user_member_invitation (
    id_user
);
CREATE INDEX idx_user_member_invitation_member ON user_member_invitation (
    member_id
);
CREATE TRIGGER update_user_member_invitation_modtime
BEFORE UPDATE ON user_member_invitation
FOR EACH ROW
EXECUTE FUNCTION update_changetimestamp_column();

CREATE TABLE IF NOT EXISTS gestionnaire_invitation (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_email TEXT NOT NULL,
    id_user INT REFERENCES app_user (id),
    id_community INT NOT NULL REFERENCES community (id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp
);

CREATE INDEX idx_gestionnaire_invitation_user ON gestionnaire_invitation (
    id_user
);
CREATE INDEX idx_gestionnaire_invitation_community ON gestionnaire_invitation (
    id_community
);
CREATE TRIGGER update_gestionnaire_invitation_modtime
BEFORE UPDATE ON gestionnaire_invitation
FOR EACH ROW
EXECUTE FUNCTION update_changetimestamp_column();
