import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigFloat: { input: any; output: any; }
  BigInt: { input: number; output: number; }
  Cursor: { input: any; output: any; }
  Date: { input: string; output: string; }
  Datetime: { input: any; output: any; }
  JSON: { input: any; output: any; }
  Opaque: { input: any; output: any; }
  Time: { input: any; output: any; }
  UUID: { input: string; output: string; }
};

/** Boolean expression comparing fields on type "BigFloat" */
export type BigFloatFilter = {
  eq?: InputMaybe<Scalars['BigFloat']['input']>;
  gt?: InputMaybe<Scalars['BigFloat']['input']>;
  gte?: InputMaybe<Scalars['BigFloat']['input']>;
  in?: InputMaybe<Array<Scalars['BigFloat']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['BigFloat']['input']>;
  lte?: InputMaybe<Scalars['BigFloat']['input']>;
  neq?: InputMaybe<Scalars['BigFloat']['input']>;
};

/** Boolean expression comparing fields on type "BigFloatList" */
export type BigFloatListFilter = {
  containedBy?: InputMaybe<Array<Scalars['BigFloat']['input']>>;
  contains?: InputMaybe<Array<Scalars['BigFloat']['input']>>;
  eq?: InputMaybe<Array<Scalars['BigFloat']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['BigFloat']['input']>>;
};

/** Boolean expression comparing fields on type "BigInt" */
export type BigIntFilter = {
  eq?: InputMaybe<Scalars['BigInt']['input']>;
  gt?: InputMaybe<Scalars['BigInt']['input']>;
  gte?: InputMaybe<Scalars['BigInt']['input']>;
  in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['BigInt']['input']>;
  lte?: InputMaybe<Scalars['BigInt']['input']>;
  neq?: InputMaybe<Scalars['BigInt']['input']>;
};

/** Boolean expression comparing fields on type "BigIntList" */
export type BigIntListFilter = {
  containedBy?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  contains?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  eq?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['BigInt']['input']>>;
};

/** Boolean expression comparing fields on type "Boolean" */
export type BooleanFilter = {
  eq?: InputMaybe<Scalars['Boolean']['input']>;
  is?: InputMaybe<FilterIs>;
};

/** Boolean expression comparing fields on type "BooleanList" */
export type BooleanListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  contains?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  eq?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Boolean']['input']>>;
};

/** Boolean expression comparing fields on type "Date" */
export type DateFilter = {
  eq?: InputMaybe<Scalars['Date']['input']>;
  gt?: InputMaybe<Scalars['Date']['input']>;
  gte?: InputMaybe<Scalars['Date']['input']>;
  in?: InputMaybe<Array<Scalars['Date']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['Date']['input']>;
  lte?: InputMaybe<Scalars['Date']['input']>;
  neq?: InputMaybe<Scalars['Date']['input']>;
};

/** Boolean expression comparing fields on type "DateList" */
export type DateListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Date']['input']>>;
  contains?: InputMaybe<Array<Scalars['Date']['input']>>;
  eq?: InputMaybe<Array<Scalars['Date']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Date']['input']>>;
};

/** Boolean expression comparing fields on type "Datetime" */
export type DatetimeFilter = {
  eq?: InputMaybe<Scalars['Datetime']['input']>;
  gt?: InputMaybe<Scalars['Datetime']['input']>;
  gte?: InputMaybe<Scalars['Datetime']['input']>;
  in?: InputMaybe<Array<Scalars['Datetime']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['Datetime']['input']>;
  lte?: InputMaybe<Scalars['Datetime']['input']>;
  neq?: InputMaybe<Scalars['Datetime']['input']>;
};

/** Boolean expression comparing fields on type "DatetimeList" */
export type DatetimeListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Datetime']['input']>>;
  contains?: InputMaybe<Array<Scalars['Datetime']['input']>>;
  eq?: InputMaybe<Array<Scalars['Datetime']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Datetime']['input']>>;
};

export enum FilterIs {
  NotNull = 'NOT_NULL',
  Null = 'NULL'
}

/** Boolean expression comparing fields on type "Float" */
export type FloatFilter = {
  eq?: InputMaybe<Scalars['Float']['input']>;
  gt?: InputMaybe<Scalars['Float']['input']>;
  gte?: InputMaybe<Scalars['Float']['input']>;
  in?: InputMaybe<Array<Scalars['Float']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['Float']['input']>;
  lte?: InputMaybe<Scalars['Float']['input']>;
  neq?: InputMaybe<Scalars['Float']['input']>;
};

/** Boolean expression comparing fields on type "FloatList" */
export type FloatListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Float']['input']>>;
  contains?: InputMaybe<Array<Scalars['Float']['input']>>;
  eq?: InputMaybe<Array<Scalars['Float']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Float']['input']>>;
};

/** Boolean expression comparing fields on type "ID" */
export type IdFilter = {
  eq?: InputMaybe<Scalars['ID']['input']>;
};

/** Boolean expression comparing fields on type "Int" */
export type IntFilter = {
  eq?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  in?: InputMaybe<Array<Scalars['Int']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  neq?: InputMaybe<Scalars['Int']['input']>;
};

/** Boolean expression comparing fields on type "IntList" */
export type IntListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Int']['input']>>;
  contains?: InputMaybe<Array<Scalars['Int']['input']>>;
  eq?: InputMaybe<Array<Scalars['Int']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Int']['input']>>;
};

/** The root type for creating and mutating data */
export type Mutation = {
  __typename?: 'Mutation';
  add_dual_system_fields?: Maybe<Scalars['Opaque']['output']>;
  add_dual_system_support?: Maybe<Scalars['Opaque']['output']>;
  calculate_age?: Maybe<Scalars['Int']['output']>;
  create_dual_indexes_for_table?: Maybe<Scalars['Opaque']['output']>;
  create_dual_system_indexes?: Maybe<Scalars['Opaque']['output']>;
  /** Deletes zero or more records from the `appointments` collection */
  deleteFromappointmentsCollection: AppointmentsDeleteResponse;
  /** Deletes zero or more records from the `assessments` collection */
  deleteFromassessmentsCollection: AssessmentsDeleteResponse;
  /** Deletes zero or more records from the `auth_group` collection */
  deleteFromauth_groupCollection: Auth_GroupDeleteResponse;
  /** Deletes zero or more records from the `auth_group_permissions` collection */
  deleteFromauth_group_permissionsCollection: Auth_Group_PermissionsDeleteResponse;
  /** Deletes zero or more records from the `auth_permission` collection */
  deleteFromauth_permissionCollection: Auth_PermissionDeleteResponse;
  /** Deletes zero or more records from the `clinic_configurations` collection */
  deleteFromclinic_configurationsCollection: Clinic_ConfigurationsDeleteResponse;
  /** Deletes zero or more records from the `clinic_invitations` collection */
  deleteFromclinic_invitationsCollection: Clinic_InvitationsDeleteResponse;
  /** Deletes zero or more records from the `clinic_profiles` collection */
  deleteFromclinic_profilesCollection: Clinic_ProfilesDeleteResponse;
  /** Deletes zero or more records from the `clinics` collection */
  deleteFromclinicsCollection: ClinicsDeleteResponse;
  /** Deletes zero or more records from the `clinimetrix_assessments` collection */
  deleteFromclinimetrix_assessmentsCollection: Clinimetrix_AssessmentsDeleteResponse;
  /** Deletes zero or more records from the `clinimetrix_registry` collection */
  deleteFromclinimetrix_registryCollection: Clinimetrix_RegistryDeleteResponse;
  /** Deletes zero or more records from the `clinimetrix_remote_assessments` collection */
  deleteFromclinimetrix_remote_assessmentsCollection: Clinimetrix_Remote_AssessmentsDeleteResponse;
  /** Deletes zero or more records from the `clinimetrix_responses` collection */
  deleteFromclinimetrix_responsesCollection: Clinimetrix_ResponsesDeleteResponse;
  /** Deletes zero or more records from the `clinimetrix_scale_categories` collection */
  deleteFromclinimetrix_scale_categoriesCollection: Clinimetrix_Scale_CategoriesDeleteResponse;
  /** Deletes zero or more records from the `clinimetrix_scale_tags` collection */
  deleteFromclinimetrix_scale_tagsCollection: Clinimetrix_Scale_TagsDeleteResponse;
  /** Deletes zero or more records from the `clinimetrix_templates` collection */
  deleteFromclinimetrix_templatesCollection: Clinimetrix_TemplatesDeleteResponse;
  /** Deletes zero or more records from the `consultation_templates` collection */
  deleteFromconsultation_templatesCollection: Consultation_TemplatesDeleteResponse;
  /** Deletes zero or more records from the `consultations` collection */
  deleteFromconsultationsCollection: ConsultationsDeleteResponse;
  /** Deletes zero or more records from the `django_admin_log` collection */
  deleteFromdjango_admin_logCollection: Django_Admin_LogDeleteResponse;
  /** Deletes zero or more records from the `django_content_type` collection */
  deleteFromdjango_content_typeCollection: Django_Content_TypeDeleteResponse;
  /** Deletes zero or more records from the `django_migrations` collection */
  deleteFromdjango_migrationsCollection: Django_MigrationsDeleteResponse;
  /** Deletes zero or more records from the `dynamic_forms` collection */
  deleteFromdynamic_formsCollection: Dynamic_FormsDeleteResponse;
  /** Deletes zero or more records from the `finance_cash_register_cuts` collection */
  deleteFromfinance_cash_register_cutsCollection: Finance_Cash_Register_CutsDeleteResponse;
  /** Deletes zero or more records from the `finance_income` collection */
  deleteFromfinance_incomeCollection: Finance_IncomeDeleteResponse;
  /** Deletes zero or more records from the `finance_payment_method_config` collection */
  deleteFromfinance_payment_method_configCollection: Finance_Payment_Method_ConfigDeleteResponse;
  /** Deletes zero or more records from the `finance_services` collection */
  deleteFromfinance_servicesCollection: Finance_ServicesDeleteResponse;
  /** Deletes zero or more records from the `form_submissions` collection */
  deleteFromform_submissionsCollection: Form_SubmissionsDeleteResponse;
  /** Deletes zero or more records from the `individual_workspaces` collection */
  deleteFromindividual_workspacesCollection: Individual_WorkspacesDeleteResponse;
  /** Deletes zero or more records from the `medical_access_log` collection */
  deleteFrommedical_access_logCollection: Medical_Access_LogDeleteResponse;
  /** Deletes zero or more records from the `medical_audit_log` collection */
  deleteFrommedical_audit_logCollection: Medical_Audit_LogDeleteResponse;
  /** Deletes zero or more records from the `medical_compliance_reports` collection */
  deleteFrommedical_compliance_reportsCollection: Medical_Compliance_ReportsDeleteResponse;
  /** Deletes zero or more records from the `medical_history` collection */
  deleteFrommedical_historyCollection: Medical_HistoryDeleteResponse;
  /** Deletes zero or more records from the `medical_resources` collection */
  deleteFrommedical_resourcesCollection: Medical_ResourcesDeleteResponse;
  /** Deletes zero or more records from the `patients` collection */
  deleteFrompatientsCollection: PatientsDeleteResponse;
  /** Deletes zero or more records from the `practice_locations` collection */
  deleteFrompractice_locationsCollection: Practice_LocationsDeleteResponse;
  /** Deletes zero or more records from the `prescriptions` collection */
  deleteFromprescriptionsCollection: PrescriptionsDeleteResponse;
  /** Deletes zero or more records from the `profiles` collection */
  deleteFromprofilesCollection: ProfilesDeleteResponse;
  /** Deletes zero or more records from the `psychometric_scales` collection */
  deleteFrompsychometric_scalesCollection: Psychometric_ScalesDeleteResponse;
  /** Deletes zero or more records from the `resource_categories` collection */
  deleteFromresource_categoriesCollection: Resource_CategoriesDeleteResponse;
  /** Deletes zero or more records from the `scale_items` collection */
  deleteFromscale_itemsCollection: Scale_ItemsDeleteResponse;
  /** Deletes zero or more records from the `schedule_config` collection */
  deleteFromschedule_configCollection: Schedule_ConfigDeleteResponse;
  /** Deletes zero or more records from the `tenant_memberships` collection */
  deleteFromtenant_membershipsCollection: Tenant_MembershipsDeleteResponse;
  /** Deletes zero or more records from the `user_favorite_scales` collection */
  deleteFromuser_favorite_scalesCollection: User_Favorite_ScalesDeleteResponse;
  get_current_tenant_id?: Maybe<Scalars['UUID']['output']>;
  get_patient_access_summary?: Maybe<Scalars['JSON']['output']>;
  /** Adds one or more `appointments` records to the collection */
  insertIntoappointmentsCollection?: Maybe<AppointmentsInsertResponse>;
  /** Adds one or more `assessments` records to the collection */
  insertIntoassessmentsCollection?: Maybe<AssessmentsInsertResponse>;
  /** Adds one or more `auth_group` records to the collection */
  insertIntoauth_groupCollection?: Maybe<Auth_GroupInsertResponse>;
  /** Adds one or more `auth_group_permissions` records to the collection */
  insertIntoauth_group_permissionsCollection?: Maybe<Auth_Group_PermissionsInsertResponse>;
  /** Adds one or more `auth_permission` records to the collection */
  insertIntoauth_permissionCollection?: Maybe<Auth_PermissionInsertResponse>;
  /** Adds one or more `clinic_configurations` records to the collection */
  insertIntoclinic_configurationsCollection?: Maybe<Clinic_ConfigurationsInsertResponse>;
  /** Adds one or more `clinic_invitations` records to the collection */
  insertIntoclinic_invitationsCollection?: Maybe<Clinic_InvitationsInsertResponse>;
  /** Adds one or more `clinic_profiles` records to the collection */
  insertIntoclinic_profilesCollection?: Maybe<Clinic_ProfilesInsertResponse>;
  /** Adds one or more `clinics` records to the collection */
  insertIntoclinicsCollection?: Maybe<ClinicsInsertResponse>;
  /** Adds one or more `clinimetrix_assessments` records to the collection */
  insertIntoclinimetrix_assessmentsCollection?: Maybe<Clinimetrix_AssessmentsInsertResponse>;
  /** Adds one or more `clinimetrix_registry` records to the collection */
  insertIntoclinimetrix_registryCollection?: Maybe<Clinimetrix_RegistryInsertResponse>;
  /** Adds one or more `clinimetrix_remote_assessments` records to the collection */
  insertIntoclinimetrix_remote_assessmentsCollection?: Maybe<Clinimetrix_Remote_AssessmentsInsertResponse>;
  /** Adds one or more `clinimetrix_responses` records to the collection */
  insertIntoclinimetrix_responsesCollection?: Maybe<Clinimetrix_ResponsesInsertResponse>;
  /** Adds one or more `clinimetrix_scale_categories` records to the collection */
  insertIntoclinimetrix_scale_categoriesCollection?: Maybe<Clinimetrix_Scale_CategoriesInsertResponse>;
  /** Adds one or more `clinimetrix_scale_tags` records to the collection */
  insertIntoclinimetrix_scale_tagsCollection?: Maybe<Clinimetrix_Scale_TagsInsertResponse>;
  /** Adds one or more `clinimetrix_templates` records to the collection */
  insertIntoclinimetrix_templatesCollection?: Maybe<Clinimetrix_TemplatesInsertResponse>;
  /** Adds one or more `consultation_templates` records to the collection */
  insertIntoconsultation_templatesCollection?: Maybe<Consultation_TemplatesInsertResponse>;
  /** Adds one or more `consultations` records to the collection */
  insertIntoconsultationsCollection?: Maybe<ConsultationsInsertResponse>;
  /** Adds one or more `django_admin_log` records to the collection */
  insertIntodjango_admin_logCollection?: Maybe<Django_Admin_LogInsertResponse>;
  /** Adds one or more `django_content_type` records to the collection */
  insertIntodjango_content_typeCollection?: Maybe<Django_Content_TypeInsertResponse>;
  /** Adds one or more `django_migrations` records to the collection */
  insertIntodjango_migrationsCollection?: Maybe<Django_MigrationsInsertResponse>;
  /** Adds one or more `dynamic_forms` records to the collection */
  insertIntodynamic_formsCollection?: Maybe<Dynamic_FormsInsertResponse>;
  /** Adds one or more `finance_cash_register_cuts` records to the collection */
  insertIntofinance_cash_register_cutsCollection?: Maybe<Finance_Cash_Register_CutsInsertResponse>;
  /** Adds one or more `finance_income` records to the collection */
  insertIntofinance_incomeCollection?: Maybe<Finance_IncomeInsertResponse>;
  /** Adds one or more `finance_payment_method_config` records to the collection */
  insertIntofinance_payment_method_configCollection?: Maybe<Finance_Payment_Method_ConfigInsertResponse>;
  /** Adds one or more `finance_services` records to the collection */
  insertIntofinance_servicesCollection?: Maybe<Finance_ServicesInsertResponse>;
  /** Adds one or more `form_submissions` records to the collection */
  insertIntoform_submissionsCollection?: Maybe<Form_SubmissionsInsertResponse>;
  /** Adds one or more `individual_workspaces` records to the collection */
  insertIntoindividual_workspacesCollection?: Maybe<Individual_WorkspacesInsertResponse>;
  /** Adds one or more `medical_access_log` records to the collection */
  insertIntomedical_access_logCollection?: Maybe<Medical_Access_LogInsertResponse>;
  /** Adds one or more `medical_audit_log` records to the collection */
  insertIntomedical_audit_logCollection?: Maybe<Medical_Audit_LogInsertResponse>;
  /** Adds one or more `medical_compliance_reports` records to the collection */
  insertIntomedical_compliance_reportsCollection?: Maybe<Medical_Compliance_ReportsInsertResponse>;
  /** Adds one or more `medical_history` records to the collection */
  insertIntomedical_historyCollection?: Maybe<Medical_HistoryInsertResponse>;
  /** Adds one or more `medical_resources` records to the collection */
  insertIntomedical_resourcesCollection?: Maybe<Medical_ResourcesInsertResponse>;
  /** Adds one or more `patients` records to the collection */
  insertIntopatientsCollection?: Maybe<PatientsInsertResponse>;
  /** Adds one or more `practice_locations` records to the collection */
  insertIntopractice_locationsCollection?: Maybe<Practice_LocationsInsertResponse>;
  /** Adds one or more `prescriptions` records to the collection */
  insertIntoprescriptionsCollection?: Maybe<PrescriptionsInsertResponse>;
  /** Adds one or more `profiles` records to the collection */
  insertIntoprofilesCollection?: Maybe<ProfilesInsertResponse>;
  /** Adds one or more `psychometric_scales` records to the collection */
  insertIntopsychometric_scalesCollection?: Maybe<Psychometric_ScalesInsertResponse>;
  /** Adds one or more `resource_categories` records to the collection */
  insertIntoresource_categoriesCollection?: Maybe<Resource_CategoriesInsertResponse>;
  /** Adds one or more `scale_items` records to the collection */
  insertIntoscale_itemsCollection?: Maybe<Scale_ItemsInsertResponse>;
  /** Adds one or more `schedule_config` records to the collection */
  insertIntoschedule_configCollection?: Maybe<Schedule_ConfigInsertResponse>;
  /** Adds one or more `tenant_memberships` records to the collection */
  insertIntotenant_membershipsCollection?: Maybe<Tenant_MembershipsInsertResponse>;
  /** Adds one or more `user_favorite_scales` records to the collection */
  insertIntouser_favorite_scalesCollection?: Maybe<User_Favorite_ScalesInsertResponse>;
  is_admin?: Maybe<Scalars['Boolean']['output']>;
  is_healthcare_professional?: Maybe<Scalars['Boolean']['output']>;
  log_patient_access?: Maybe<Scalars['UUID']['output']>;
  setup_admin_user?: Maybe<Scalars['String']['output']>;
  /** Updates zero or more records in the `appointments` collection */
  updateappointmentsCollection: AppointmentsUpdateResponse;
  /** Updates zero or more records in the `assessments` collection */
  updateassessmentsCollection: AssessmentsUpdateResponse;
  /** Updates zero or more records in the `auth_group` collection */
  updateauth_groupCollection: Auth_GroupUpdateResponse;
  /** Updates zero or more records in the `auth_group_permissions` collection */
  updateauth_group_permissionsCollection: Auth_Group_PermissionsUpdateResponse;
  /** Updates zero or more records in the `auth_permission` collection */
  updateauth_permissionCollection: Auth_PermissionUpdateResponse;
  /** Updates zero or more records in the `clinic_configurations` collection */
  updateclinic_configurationsCollection: Clinic_ConfigurationsUpdateResponse;
  /** Updates zero or more records in the `clinic_invitations` collection */
  updateclinic_invitationsCollection: Clinic_InvitationsUpdateResponse;
  /** Updates zero or more records in the `clinic_profiles` collection */
  updateclinic_profilesCollection: Clinic_ProfilesUpdateResponse;
  /** Updates zero or more records in the `clinics` collection */
  updateclinicsCollection: ClinicsUpdateResponse;
  /** Updates zero or more records in the `clinimetrix_assessments` collection */
  updateclinimetrix_assessmentsCollection: Clinimetrix_AssessmentsUpdateResponse;
  /** Updates zero or more records in the `clinimetrix_registry` collection */
  updateclinimetrix_registryCollection: Clinimetrix_RegistryUpdateResponse;
  /** Updates zero or more records in the `clinimetrix_remote_assessments` collection */
  updateclinimetrix_remote_assessmentsCollection: Clinimetrix_Remote_AssessmentsUpdateResponse;
  /** Updates zero or more records in the `clinimetrix_responses` collection */
  updateclinimetrix_responsesCollection: Clinimetrix_ResponsesUpdateResponse;
  /** Updates zero or more records in the `clinimetrix_scale_categories` collection */
  updateclinimetrix_scale_categoriesCollection: Clinimetrix_Scale_CategoriesUpdateResponse;
  /** Updates zero or more records in the `clinimetrix_scale_tags` collection */
  updateclinimetrix_scale_tagsCollection: Clinimetrix_Scale_TagsUpdateResponse;
  /** Updates zero or more records in the `clinimetrix_templates` collection */
  updateclinimetrix_templatesCollection: Clinimetrix_TemplatesUpdateResponse;
  /** Updates zero or more records in the `consultation_templates` collection */
  updateconsultation_templatesCollection: Consultation_TemplatesUpdateResponse;
  /** Updates zero or more records in the `consultations` collection */
  updateconsultationsCollection: ConsultationsUpdateResponse;
  /** Updates zero or more records in the `django_admin_log` collection */
  updatedjango_admin_logCollection: Django_Admin_LogUpdateResponse;
  /** Updates zero or more records in the `django_content_type` collection */
  updatedjango_content_typeCollection: Django_Content_TypeUpdateResponse;
  /** Updates zero or more records in the `django_migrations` collection */
  updatedjango_migrationsCollection: Django_MigrationsUpdateResponse;
  /** Updates zero or more records in the `dynamic_forms` collection */
  updatedynamic_formsCollection: Dynamic_FormsUpdateResponse;
  /** Updates zero or more records in the `finance_cash_register_cuts` collection */
  updatefinance_cash_register_cutsCollection: Finance_Cash_Register_CutsUpdateResponse;
  /** Updates zero or more records in the `finance_income` collection */
  updatefinance_incomeCollection: Finance_IncomeUpdateResponse;
  /** Updates zero or more records in the `finance_payment_method_config` collection */
  updatefinance_payment_method_configCollection: Finance_Payment_Method_ConfigUpdateResponse;
  /** Updates zero or more records in the `finance_services` collection */
  updatefinance_servicesCollection: Finance_ServicesUpdateResponse;
  /** Updates zero or more records in the `form_submissions` collection */
  updateform_submissionsCollection: Form_SubmissionsUpdateResponse;
  /** Updates zero or more records in the `individual_workspaces` collection */
  updateindividual_workspacesCollection: Individual_WorkspacesUpdateResponse;
  /** Updates zero or more records in the `medical_access_log` collection */
  updatemedical_access_logCollection: Medical_Access_LogUpdateResponse;
  /** Updates zero or more records in the `medical_audit_log` collection */
  updatemedical_audit_logCollection: Medical_Audit_LogUpdateResponse;
  /** Updates zero or more records in the `medical_compliance_reports` collection */
  updatemedical_compliance_reportsCollection: Medical_Compliance_ReportsUpdateResponse;
  /** Updates zero or more records in the `medical_history` collection */
  updatemedical_historyCollection: Medical_HistoryUpdateResponse;
  /** Updates zero or more records in the `medical_resources` collection */
  updatemedical_resourcesCollection: Medical_ResourcesUpdateResponse;
  /** Updates zero or more records in the `patients` collection */
  updatepatientsCollection: PatientsUpdateResponse;
  /** Updates zero or more records in the `practice_locations` collection */
  updatepractice_locationsCollection: Practice_LocationsUpdateResponse;
  /** Updates zero or more records in the `prescriptions` collection */
  updateprescriptionsCollection: PrescriptionsUpdateResponse;
  /** Updates zero or more records in the `profiles` collection */
  updateprofilesCollection: ProfilesUpdateResponse;
  /** Updates zero or more records in the `psychometric_scales` collection */
  updatepsychometric_scalesCollection: Psychometric_ScalesUpdateResponse;
  /** Updates zero or more records in the `resource_categories` collection */
  updateresource_categoriesCollection: Resource_CategoriesUpdateResponse;
  /** Updates zero or more records in the `scale_items` collection */
  updatescale_itemsCollection: Scale_ItemsUpdateResponse;
  /** Updates zero or more records in the `schedule_config` collection */
  updateschedule_configCollection: Schedule_ConfigUpdateResponse;
  /** Updates zero or more records in the `tenant_memberships` collection */
  updatetenant_membershipsCollection: Tenant_MembershipsUpdateResponse;
  /** Updates zero or more records in the `user_favorite_scales` collection */
  updateuser_favorite_scalesCollection: User_Favorite_ScalesUpdateResponse;
};


/** The root type for creating and mutating data */
export type MutationAdd_Dual_System_FieldsArgs = {
  table_name: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationAdd_Dual_System_SupportArgs = {
  table_name: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationCalculate_AgeArgs = {
  birth_date: Scalars['Date']['input'];
};


/** The root type for creating and mutating data */
export type MutationCreate_Dual_Indexes_For_TableArgs = {
  table_name: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationCreate_Dual_System_IndexesArgs = {
  table_name: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationDeleteFromappointmentsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<AppointmentsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromassessmentsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<AssessmentsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromauth_GroupCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Auth_GroupFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromauth_Group_PermissionsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Auth_Group_PermissionsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromauth_PermissionCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Auth_PermissionFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromclinic_ConfigurationsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Clinic_ConfigurationsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromclinic_InvitationsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Clinic_InvitationsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromclinic_ProfilesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Clinic_ProfilesFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromclinicsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ClinicsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromclinimetrix_AssessmentsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Clinimetrix_AssessmentsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromclinimetrix_RegistryCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Clinimetrix_RegistryFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromclinimetrix_Remote_AssessmentsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Clinimetrix_Remote_AssessmentsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromclinimetrix_ResponsesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Clinimetrix_ResponsesFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromclinimetrix_Scale_CategoriesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Clinimetrix_Scale_CategoriesFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromclinimetrix_Scale_TagsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Clinimetrix_Scale_TagsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromclinimetrix_TemplatesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Clinimetrix_TemplatesFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromconsultation_TemplatesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Consultation_TemplatesFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromconsultationsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ConsultationsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromdjango_Admin_LogCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Django_Admin_LogFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromdjango_Content_TypeCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Django_Content_TypeFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromdjango_MigrationsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Django_MigrationsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromdynamic_FormsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Dynamic_FormsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromfinance_Cash_Register_CutsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Finance_Cash_Register_CutsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromfinance_IncomeCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Finance_IncomeFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromfinance_Payment_Method_ConfigCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Finance_Payment_Method_ConfigFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromfinance_ServicesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Finance_ServicesFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromform_SubmissionsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Form_SubmissionsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromindividual_WorkspacesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Individual_WorkspacesFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFrommedical_Access_LogCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Medical_Access_LogFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFrommedical_Audit_LogCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Medical_Audit_LogFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFrommedical_Compliance_ReportsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Medical_Compliance_ReportsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFrommedical_HistoryCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Medical_HistoryFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFrommedical_ResourcesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Medical_ResourcesFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFrompatientsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<PatientsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFrompractice_LocationsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Practice_LocationsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromprescriptionsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<PrescriptionsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromprofilesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ProfilesFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFrompsychometric_ScalesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Psychometric_ScalesFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromresource_CategoriesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Resource_CategoriesFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromscale_ItemsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Scale_ItemsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromschedule_ConfigCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Schedule_ConfigFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromtenant_MembershipsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Tenant_MembershipsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromuser_Favorite_ScalesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<User_Favorite_ScalesFilter>;
};


/** The root type for creating and mutating data */
export type MutationGet_Patient_Access_SummaryArgs = {
  p_days_back?: InputMaybe<Scalars['Int']['input']>;
  p_patient_id: Scalars['UUID']['input'];
};


/** The root type for creating and mutating data */
export type MutationInsertIntoappointmentsCollectionArgs = {
  objects: Array<AppointmentsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoassessmentsCollectionArgs = {
  objects: Array<AssessmentsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoauth_GroupCollectionArgs = {
  objects: Array<Auth_GroupInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoauth_Group_PermissionsCollectionArgs = {
  objects: Array<Auth_Group_PermissionsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoauth_PermissionCollectionArgs = {
  objects: Array<Auth_PermissionInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoclinic_ConfigurationsCollectionArgs = {
  objects: Array<Clinic_ConfigurationsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoclinic_InvitationsCollectionArgs = {
  objects: Array<Clinic_InvitationsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoclinic_ProfilesCollectionArgs = {
  objects: Array<Clinic_ProfilesInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoclinicsCollectionArgs = {
  objects: Array<ClinicsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoclinimetrix_AssessmentsCollectionArgs = {
  objects: Array<Clinimetrix_AssessmentsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoclinimetrix_RegistryCollectionArgs = {
  objects: Array<Clinimetrix_RegistryInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoclinimetrix_Remote_AssessmentsCollectionArgs = {
  objects: Array<Clinimetrix_Remote_AssessmentsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoclinimetrix_ResponsesCollectionArgs = {
  objects: Array<Clinimetrix_ResponsesInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoclinimetrix_Scale_CategoriesCollectionArgs = {
  objects: Array<Clinimetrix_Scale_CategoriesInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoclinimetrix_Scale_TagsCollectionArgs = {
  objects: Array<Clinimetrix_Scale_TagsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoclinimetrix_TemplatesCollectionArgs = {
  objects: Array<Clinimetrix_TemplatesInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoconsultation_TemplatesCollectionArgs = {
  objects: Array<Consultation_TemplatesInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoconsultationsCollectionArgs = {
  objects: Array<ConsultationsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntodjango_Admin_LogCollectionArgs = {
  objects: Array<Django_Admin_LogInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntodjango_Content_TypeCollectionArgs = {
  objects: Array<Django_Content_TypeInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntodjango_MigrationsCollectionArgs = {
  objects: Array<Django_MigrationsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntodynamic_FormsCollectionArgs = {
  objects: Array<Dynamic_FormsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntofinance_Cash_Register_CutsCollectionArgs = {
  objects: Array<Finance_Cash_Register_CutsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntofinance_IncomeCollectionArgs = {
  objects: Array<Finance_IncomeInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntofinance_Payment_Method_ConfigCollectionArgs = {
  objects: Array<Finance_Payment_Method_ConfigInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntofinance_ServicesCollectionArgs = {
  objects: Array<Finance_ServicesInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoform_SubmissionsCollectionArgs = {
  objects: Array<Form_SubmissionsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoindividual_WorkspacesCollectionArgs = {
  objects: Array<Individual_WorkspacesInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntomedical_Access_LogCollectionArgs = {
  objects: Array<Medical_Access_LogInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntomedical_Audit_LogCollectionArgs = {
  objects: Array<Medical_Audit_LogInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntomedical_Compliance_ReportsCollectionArgs = {
  objects: Array<Medical_Compliance_ReportsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntomedical_HistoryCollectionArgs = {
  objects: Array<Medical_HistoryInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntomedical_ResourcesCollectionArgs = {
  objects: Array<Medical_ResourcesInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntopatientsCollectionArgs = {
  objects: Array<PatientsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntopractice_LocationsCollectionArgs = {
  objects: Array<Practice_LocationsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoprescriptionsCollectionArgs = {
  objects: Array<PrescriptionsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoprofilesCollectionArgs = {
  objects: Array<ProfilesInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntopsychometric_ScalesCollectionArgs = {
  objects: Array<Psychometric_ScalesInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoresource_CategoriesCollectionArgs = {
  objects: Array<Resource_CategoriesInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoscale_ItemsCollectionArgs = {
  objects: Array<Scale_ItemsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoschedule_ConfigCollectionArgs = {
  objects: Array<Schedule_ConfigInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntotenant_MembershipsCollectionArgs = {
  objects: Array<Tenant_MembershipsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntouser_Favorite_ScalesCollectionArgs = {
  objects: Array<User_Favorite_ScalesInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationLog_Patient_AccessArgs = {
  p_access_type: Scalars['String']['input'];
  p_data_type: Scalars['String']['input'];
  p_patient_id: Scalars['UUID']['input'];
  p_purpose?: InputMaybe<Scalars['String']['input']>;
  p_resource_id?: InputMaybe<Scalars['UUID']['input']>;
};


/** The root type for creating and mutating data */
export type MutationSetup_Admin_UserArgs = {
  admin_email: Scalars['String']['input'];
  admin_name?: InputMaybe<Scalars['String']['input']>;
};


/** The root type for creating and mutating data */
export type MutationUpdateappointmentsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<AppointmentsFilter>;
  set: AppointmentsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateassessmentsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<AssessmentsFilter>;
  set: AssessmentsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateauth_GroupCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Auth_GroupFilter>;
  set: Auth_GroupUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateauth_Group_PermissionsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Auth_Group_PermissionsFilter>;
  set: Auth_Group_PermissionsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateauth_PermissionCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Auth_PermissionFilter>;
  set: Auth_PermissionUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateclinic_ConfigurationsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Clinic_ConfigurationsFilter>;
  set: Clinic_ConfigurationsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateclinic_InvitationsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Clinic_InvitationsFilter>;
  set: Clinic_InvitationsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateclinic_ProfilesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Clinic_ProfilesFilter>;
  set: Clinic_ProfilesUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateclinicsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ClinicsFilter>;
  set: ClinicsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateclinimetrix_AssessmentsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Clinimetrix_AssessmentsFilter>;
  set: Clinimetrix_AssessmentsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateclinimetrix_RegistryCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Clinimetrix_RegistryFilter>;
  set: Clinimetrix_RegistryUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateclinimetrix_Remote_AssessmentsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Clinimetrix_Remote_AssessmentsFilter>;
  set: Clinimetrix_Remote_AssessmentsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateclinimetrix_ResponsesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Clinimetrix_ResponsesFilter>;
  set: Clinimetrix_ResponsesUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateclinimetrix_Scale_CategoriesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Clinimetrix_Scale_CategoriesFilter>;
  set: Clinimetrix_Scale_CategoriesUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateclinimetrix_Scale_TagsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Clinimetrix_Scale_TagsFilter>;
  set: Clinimetrix_Scale_TagsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateclinimetrix_TemplatesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Clinimetrix_TemplatesFilter>;
  set: Clinimetrix_TemplatesUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateconsultation_TemplatesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Consultation_TemplatesFilter>;
  set: Consultation_TemplatesUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateconsultationsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ConsultationsFilter>;
  set: ConsultationsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatedjango_Admin_LogCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Django_Admin_LogFilter>;
  set: Django_Admin_LogUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatedjango_Content_TypeCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Django_Content_TypeFilter>;
  set: Django_Content_TypeUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatedjango_MigrationsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Django_MigrationsFilter>;
  set: Django_MigrationsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatedynamic_FormsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Dynamic_FormsFilter>;
  set: Dynamic_FormsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatefinance_Cash_Register_CutsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Finance_Cash_Register_CutsFilter>;
  set: Finance_Cash_Register_CutsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatefinance_IncomeCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Finance_IncomeFilter>;
  set: Finance_IncomeUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatefinance_Payment_Method_ConfigCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Finance_Payment_Method_ConfigFilter>;
  set: Finance_Payment_Method_ConfigUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatefinance_ServicesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Finance_ServicesFilter>;
  set: Finance_ServicesUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateform_SubmissionsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Form_SubmissionsFilter>;
  set: Form_SubmissionsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateindividual_WorkspacesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Individual_WorkspacesFilter>;
  set: Individual_WorkspacesUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatemedical_Access_LogCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Medical_Access_LogFilter>;
  set: Medical_Access_LogUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatemedical_Audit_LogCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Medical_Audit_LogFilter>;
  set: Medical_Audit_LogUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatemedical_Compliance_ReportsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Medical_Compliance_ReportsFilter>;
  set: Medical_Compliance_ReportsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatemedical_HistoryCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Medical_HistoryFilter>;
  set: Medical_HistoryUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatemedical_ResourcesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Medical_ResourcesFilter>;
  set: Medical_ResourcesUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatepatientsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<PatientsFilter>;
  set: PatientsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatepractice_LocationsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Practice_LocationsFilter>;
  set: Practice_LocationsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateprescriptionsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<PrescriptionsFilter>;
  set: PrescriptionsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateprofilesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ProfilesFilter>;
  set: ProfilesUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatepsychometric_ScalesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Psychometric_ScalesFilter>;
  set: Psychometric_ScalesUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateresource_CategoriesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Resource_CategoriesFilter>;
  set: Resource_CategoriesUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatescale_ItemsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Scale_ItemsFilter>;
  set: Scale_ItemsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateschedule_ConfigCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Schedule_ConfigFilter>;
  set: Schedule_ConfigUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatetenant_MembershipsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Tenant_MembershipsFilter>;
  set: Tenant_MembershipsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateuser_Favorite_ScalesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<User_Favorite_ScalesFilter>;
  set: User_Favorite_ScalesUpdateInput;
};

export type Node = {
  /** Retrieves a record by `ID` */
  nodeId: Scalars['ID']['output'];
};

/** Boolean expression comparing fields on type "Opaque" */
export type OpaqueFilter = {
  eq?: InputMaybe<Scalars['Opaque']['input']>;
  is?: InputMaybe<FilterIs>;
};

/** Defines a per-field sorting order */
export enum OrderByDirection {
  /** Ascending order, nulls first */
  AscNullsFirst = 'AscNullsFirst',
  /** Ascending order, nulls last */
  AscNullsLast = 'AscNullsLast',
  /** Descending order, nulls first */
  DescNullsFirst = 'DescNullsFirst',
  /** Descending order, nulls last */
  DescNullsLast = 'DescNullsLast'
}

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

/** The root type for querying data */
export type Query = {
  __typename?: 'Query';
  /** A pagable collection of type `appointments` */
  appointmentsCollection?: Maybe<AppointmentsConnection>;
  /** A pagable collection of type `assessments` */
  assessmentsCollection?: Maybe<AssessmentsConnection>;
  /** A pagable collection of type `auth_group` */
  auth_groupCollection?: Maybe<Auth_GroupConnection>;
  /** A pagable collection of type `auth_group_permissions` */
  auth_group_permissionsCollection?: Maybe<Auth_Group_PermissionsConnection>;
  /** A pagable collection of type `auth_permission` */
  auth_permissionCollection?: Maybe<Auth_PermissionConnection>;
  /** A pagable collection of type `clinic_configurations` */
  clinic_configurationsCollection?: Maybe<Clinic_ConfigurationsConnection>;
  /** A pagable collection of type `clinic_invitations` */
  clinic_invitationsCollection?: Maybe<Clinic_InvitationsConnection>;
  /** A pagable collection of type `clinic_profiles` */
  clinic_profilesCollection?: Maybe<Clinic_ProfilesConnection>;
  /** A pagable collection of type `clinics` */
  clinicsCollection?: Maybe<ClinicsConnection>;
  /** A pagable collection of type `clinimetrix_assessments` */
  clinimetrix_assessmentsCollection?: Maybe<Clinimetrix_AssessmentsConnection>;
  /** A pagable collection of type `clinimetrix_registry` */
  clinimetrix_registryCollection?: Maybe<Clinimetrix_RegistryConnection>;
  /** A pagable collection of type `clinimetrix_remote_assessments` */
  clinimetrix_remote_assessmentsCollection?: Maybe<Clinimetrix_Remote_AssessmentsConnection>;
  /** A pagable collection of type `clinimetrix_responses` */
  clinimetrix_responsesCollection?: Maybe<Clinimetrix_ResponsesConnection>;
  /** A pagable collection of type `clinimetrix_scale_categories` */
  clinimetrix_scale_categoriesCollection?: Maybe<Clinimetrix_Scale_CategoriesConnection>;
  /** A pagable collection of type `clinimetrix_scale_tags` */
  clinimetrix_scale_tagsCollection?: Maybe<Clinimetrix_Scale_TagsConnection>;
  /** A pagable collection of type `clinimetrix_templates` */
  clinimetrix_templatesCollection?: Maybe<Clinimetrix_TemplatesConnection>;
  /** A pagable collection of type `consultation_templates` */
  consultation_templatesCollection?: Maybe<Consultation_TemplatesConnection>;
  /** A pagable collection of type `consultations` */
  consultationsCollection?: Maybe<ConsultationsConnection>;
  /** A pagable collection of type `django_admin_log` */
  django_admin_logCollection?: Maybe<Django_Admin_LogConnection>;
  /** A pagable collection of type `django_content_type` */
  django_content_typeCollection?: Maybe<Django_Content_TypeConnection>;
  /** A pagable collection of type `django_migrations` */
  django_migrationsCollection?: Maybe<Django_MigrationsConnection>;
  /** A pagable collection of type `dynamic_forms` */
  dynamic_formsCollection?: Maybe<Dynamic_FormsConnection>;
  /** A pagable collection of type `finance_cash_register_cuts` */
  finance_cash_register_cutsCollection?: Maybe<Finance_Cash_Register_CutsConnection>;
  /** A pagable collection of type `finance_income` */
  finance_incomeCollection?: Maybe<Finance_IncomeConnection>;
  /** A pagable collection of type `finance_payment_method_config` */
  finance_payment_method_configCollection?: Maybe<Finance_Payment_Method_ConfigConnection>;
  /** A pagable collection of type `finance_services` */
  finance_servicesCollection?: Maybe<Finance_ServicesConnection>;
  /** A pagable collection of type `form_submissions` */
  form_submissionsCollection?: Maybe<Form_SubmissionsConnection>;
  /** A pagable collection of type `individual_workspaces` */
  individual_workspacesCollection?: Maybe<Individual_WorkspacesConnection>;
  /** A pagable collection of type `medical_access_log` */
  medical_access_logCollection?: Maybe<Medical_Access_LogConnection>;
  /** A pagable collection of type `medical_audit_log` */
  medical_audit_logCollection?: Maybe<Medical_Audit_LogConnection>;
  /** A pagable collection of type `medical_compliance_reports` */
  medical_compliance_reportsCollection?: Maybe<Medical_Compliance_ReportsConnection>;
  /** A pagable collection of type `medical_history` */
  medical_historyCollection?: Maybe<Medical_HistoryConnection>;
  /** A pagable collection of type `medical_resources` */
  medical_resourcesCollection?: Maybe<Medical_ResourcesConnection>;
  /** Retrieve a record by its `ID` */
  node?: Maybe<Node>;
  /** A pagable collection of type `patients` */
  patientsCollection?: Maybe<PatientsConnection>;
  /** A pagable collection of type `practice_locations` */
  practice_locationsCollection?: Maybe<Practice_LocationsConnection>;
  /** A pagable collection of type `prescriptions` */
  prescriptionsCollection?: Maybe<PrescriptionsConnection>;
  /** A pagable collection of type `profiles` */
  profilesCollection?: Maybe<ProfilesConnection>;
  /** A pagable collection of type `psychometric_scales` */
  psychometric_scalesCollection?: Maybe<Psychometric_ScalesConnection>;
  /** A pagable collection of type `resource_categories` */
  resource_categoriesCollection?: Maybe<Resource_CategoriesConnection>;
  /** A pagable collection of type `scale_items` */
  scale_itemsCollection?: Maybe<Scale_ItemsConnection>;
  /** A pagable collection of type `schedule_config` */
  schedule_configCollection?: Maybe<Schedule_ConfigConnection>;
  /** A pagable collection of type `tenant_memberships` */
  tenant_membershipsCollection?: Maybe<Tenant_MembershipsConnection>;
  /** A pagable collection of type `user_favorite_scales` */
  user_favorite_scalesCollection?: Maybe<User_Favorite_ScalesConnection>;
};


/** The root type for querying data */
export type QueryAppointmentsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<AppointmentsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<AppointmentsOrderBy>>;
};


/** The root type for querying data */
export type QueryAssessmentsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<AssessmentsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<AssessmentsOrderBy>>;
};


/** The root type for querying data */
export type QueryAuth_GroupCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Auth_GroupFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Auth_GroupOrderBy>>;
};


/** The root type for querying data */
export type QueryAuth_Group_PermissionsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Auth_Group_PermissionsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Auth_Group_PermissionsOrderBy>>;
};


/** The root type for querying data */
export type QueryAuth_PermissionCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Auth_PermissionFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Auth_PermissionOrderBy>>;
};


/** The root type for querying data */
export type QueryClinic_ConfigurationsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Clinic_ConfigurationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Clinic_ConfigurationsOrderBy>>;
};


/** The root type for querying data */
export type QueryClinic_InvitationsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Clinic_InvitationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Clinic_InvitationsOrderBy>>;
};


/** The root type for querying data */
export type QueryClinic_ProfilesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Clinic_ProfilesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Clinic_ProfilesOrderBy>>;
};


/** The root type for querying data */
export type QueryClinicsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ClinicsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ClinicsOrderBy>>;
};


/** The root type for querying data */
export type QueryClinimetrix_AssessmentsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Clinimetrix_AssessmentsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Clinimetrix_AssessmentsOrderBy>>;
};


/** The root type for querying data */
export type QueryClinimetrix_RegistryCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Clinimetrix_RegistryFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Clinimetrix_RegistryOrderBy>>;
};


/** The root type for querying data */
export type QueryClinimetrix_Remote_AssessmentsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Clinimetrix_Remote_AssessmentsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Clinimetrix_Remote_AssessmentsOrderBy>>;
};


/** The root type for querying data */
export type QueryClinimetrix_ResponsesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Clinimetrix_ResponsesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Clinimetrix_ResponsesOrderBy>>;
};


/** The root type for querying data */
export type QueryClinimetrix_Scale_CategoriesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Clinimetrix_Scale_CategoriesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Clinimetrix_Scale_CategoriesOrderBy>>;
};


/** The root type for querying data */
export type QueryClinimetrix_Scale_TagsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Clinimetrix_Scale_TagsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Clinimetrix_Scale_TagsOrderBy>>;
};


/** The root type for querying data */
export type QueryClinimetrix_TemplatesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Clinimetrix_TemplatesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Clinimetrix_TemplatesOrderBy>>;
};


/** The root type for querying data */
export type QueryConsultation_TemplatesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Consultation_TemplatesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Consultation_TemplatesOrderBy>>;
};


/** The root type for querying data */
export type QueryConsultationsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ConsultationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ConsultationsOrderBy>>;
};


/** The root type for querying data */
export type QueryDjango_Admin_LogCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Django_Admin_LogFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Django_Admin_LogOrderBy>>;
};


/** The root type for querying data */
export type QueryDjango_Content_TypeCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Django_Content_TypeFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Django_Content_TypeOrderBy>>;
};


/** The root type for querying data */
export type QueryDjango_MigrationsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Django_MigrationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Django_MigrationsOrderBy>>;
};


/** The root type for querying data */
export type QueryDynamic_FormsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Dynamic_FormsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Dynamic_FormsOrderBy>>;
};


/** The root type for querying data */
export type QueryFinance_Cash_Register_CutsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Finance_Cash_Register_CutsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Finance_Cash_Register_CutsOrderBy>>;
};


/** The root type for querying data */
export type QueryFinance_IncomeCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Finance_IncomeFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Finance_IncomeOrderBy>>;
};


/** The root type for querying data */
export type QueryFinance_Payment_Method_ConfigCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Finance_Payment_Method_ConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Finance_Payment_Method_ConfigOrderBy>>;
};


/** The root type for querying data */
export type QueryFinance_ServicesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Finance_ServicesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Finance_ServicesOrderBy>>;
};


/** The root type for querying data */
export type QueryForm_SubmissionsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Form_SubmissionsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Form_SubmissionsOrderBy>>;
};


/** The root type for querying data */
export type QueryIndividual_WorkspacesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Individual_WorkspacesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Individual_WorkspacesOrderBy>>;
};


/** The root type for querying data */
export type QueryMedical_Access_LogCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Medical_Access_LogFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Medical_Access_LogOrderBy>>;
};


/** The root type for querying data */
export type QueryMedical_Audit_LogCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Medical_Audit_LogFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Medical_Audit_LogOrderBy>>;
};


/** The root type for querying data */
export type QueryMedical_Compliance_ReportsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Medical_Compliance_ReportsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Medical_Compliance_ReportsOrderBy>>;
};


/** The root type for querying data */
export type QueryMedical_HistoryCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Medical_HistoryFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Medical_HistoryOrderBy>>;
};


/** The root type for querying data */
export type QueryMedical_ResourcesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Medical_ResourcesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Medical_ResourcesOrderBy>>;
};


/** The root type for querying data */
export type QueryNodeArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root type for querying data */
export type QueryPatientsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<PatientsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<PatientsOrderBy>>;
};


/** The root type for querying data */
export type QueryPractice_LocationsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Practice_LocationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Practice_LocationsOrderBy>>;
};


/** The root type for querying data */
export type QueryPrescriptionsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<PrescriptionsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<PrescriptionsOrderBy>>;
};


/** The root type for querying data */
export type QueryProfilesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ProfilesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ProfilesOrderBy>>;
};


/** The root type for querying data */
export type QueryPsychometric_ScalesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Psychometric_ScalesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Psychometric_ScalesOrderBy>>;
};


/** The root type for querying data */
export type QueryResource_CategoriesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Resource_CategoriesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Resource_CategoriesOrderBy>>;
};


/** The root type for querying data */
export type QueryScale_ItemsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Scale_ItemsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Scale_ItemsOrderBy>>;
};


/** The root type for querying data */
export type QuerySchedule_ConfigCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Schedule_ConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Schedule_ConfigOrderBy>>;
};


/** The root type for querying data */
export type QueryTenant_MembershipsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Tenant_MembershipsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Tenant_MembershipsOrderBy>>;
};


/** The root type for querying data */
export type QueryUser_Favorite_ScalesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<User_Favorite_ScalesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<User_Favorite_ScalesOrderBy>>;
};

/** Boolean expression comparing fields on type "String" */
export type StringFilter = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<Scalars['String']['input']>>;
  iregex?: InputMaybe<Scalars['String']['input']>;
  is?: InputMaybe<FilterIs>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  neq?: InputMaybe<Scalars['String']['input']>;
  regex?: InputMaybe<Scalars['String']['input']>;
  startsWith?: InputMaybe<Scalars['String']['input']>;
};

/** Boolean expression comparing fields on type "StringList" */
export type StringListFilter = {
  containedBy?: InputMaybe<Array<Scalars['String']['input']>>;
  contains?: InputMaybe<Array<Scalars['String']['input']>>;
  eq?: InputMaybe<Array<Scalars['String']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['String']['input']>>;
};

/** Boolean expression comparing fields on type "Time" */
export type TimeFilter = {
  eq?: InputMaybe<Scalars['Time']['input']>;
  gt?: InputMaybe<Scalars['Time']['input']>;
  gte?: InputMaybe<Scalars['Time']['input']>;
  in?: InputMaybe<Array<Scalars['Time']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['Time']['input']>;
  lte?: InputMaybe<Scalars['Time']['input']>;
  neq?: InputMaybe<Scalars['Time']['input']>;
};

/** Boolean expression comparing fields on type "TimeList" */
export type TimeListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Time']['input']>>;
  contains?: InputMaybe<Array<Scalars['Time']['input']>>;
  eq?: InputMaybe<Array<Scalars['Time']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Time']['input']>>;
};

/** Boolean expression comparing fields on type "UUID" */
export type UuidFilter = {
  eq?: InputMaybe<Scalars['UUID']['input']>;
  in?: InputMaybe<Array<Scalars['UUID']['input']>>;
  is?: InputMaybe<FilterIs>;
  neq?: InputMaybe<Scalars['UUID']['input']>;
};

/** Boolean expression comparing fields on type "UUIDList" */
export type UuidListFilter = {
  containedBy?: InputMaybe<Array<Scalars['UUID']['input']>>;
  contains?: InputMaybe<Array<Scalars['UUID']['input']>>;
  eq?: InputMaybe<Array<Scalars['UUID']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['UUID']['input']>>;
};

export type Appointments = Node & {
  __typename?: 'appointments';
  appointment_date: Scalars['Date']['output'];
  appointment_type?: Maybe<Scalars['String']['output']>;
  clinic_configurations?: Maybe<Clinic_Configurations>;
  clinic_id?: Maybe<Scalars['UUID']['output']>;
  confirmation_date?: Maybe<Scalars['Datetime']['output']>;
  confirmation_sent?: Maybe<Scalars['Boolean']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  end_time: Scalars['Time']['output'];
  id: Scalars['UUID']['output'];
  individual_workspaces?: Maybe<Individual_Workspaces>;
  internal_notes?: Maybe<Scalars['String']['output']>;
  is_recurring?: Maybe<Scalars['Boolean']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  patient_id?: Maybe<Scalars['UUID']['output']>;
  patients?: Maybe<Patients>;
  professional_id: Scalars['UUID']['output'];
  reason?: Maybe<Scalars['String']['output']>;
  recurring_pattern?: Maybe<Scalars['JSON']['output']>;
  reminder_date?: Maybe<Scalars['Datetime']['output']>;
  reminder_sent?: Maybe<Scalars['Boolean']['output']>;
  start_time: Scalars['Time']['output'];
  status?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  workspace_id?: Maybe<Scalars['UUID']['output']>;
};

export type AppointmentsConnection = {
  __typename?: 'appointmentsConnection';
  edges: Array<AppointmentsEdge>;
  pageInfo: PageInfo;
};

export type AppointmentsDeleteResponse = {
  __typename?: 'appointmentsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Appointments>;
};

export type AppointmentsEdge = {
  __typename?: 'appointmentsEdge';
  cursor: Scalars['String']['output'];
  node: Appointments;
};

export type AppointmentsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<AppointmentsFilter>>;
  appointment_date?: InputMaybe<DateFilter>;
  appointment_type?: InputMaybe<StringFilter>;
  clinic_id?: InputMaybe<UuidFilter>;
  confirmation_date?: InputMaybe<DatetimeFilter>;
  confirmation_sent?: InputMaybe<BooleanFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  end_time?: InputMaybe<TimeFilter>;
  id?: InputMaybe<UuidFilter>;
  internal_notes?: InputMaybe<StringFilter>;
  is_recurring?: InputMaybe<BooleanFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<AppointmentsFilter>;
  notes?: InputMaybe<StringFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<AppointmentsFilter>>;
  patient_id?: InputMaybe<UuidFilter>;
  professional_id?: InputMaybe<UuidFilter>;
  reason?: InputMaybe<StringFilter>;
  reminder_date?: InputMaybe<DatetimeFilter>;
  reminder_sent?: InputMaybe<BooleanFilter>;
  start_time?: InputMaybe<TimeFilter>;
  status?: InputMaybe<StringFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  workspace_id?: InputMaybe<UuidFilter>;
};

export type AppointmentsInsertInput = {
  appointment_date?: InputMaybe<Scalars['Date']['input']>;
  appointment_type?: InputMaybe<Scalars['String']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  confirmation_date?: InputMaybe<Scalars['Datetime']['input']>;
  confirmation_sent?: InputMaybe<Scalars['Boolean']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  end_time?: InputMaybe<Scalars['Time']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  internal_notes?: InputMaybe<Scalars['String']['input']>;
  is_recurring?: InputMaybe<Scalars['Boolean']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  professional_id?: InputMaybe<Scalars['UUID']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  recurring_pattern?: InputMaybe<Scalars['JSON']['input']>;
  reminder_date?: InputMaybe<Scalars['Datetime']['input']>;
  reminder_sent?: InputMaybe<Scalars['Boolean']['input']>;
  start_time?: InputMaybe<Scalars['Time']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type AppointmentsInsertResponse = {
  __typename?: 'appointmentsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Appointments>;
};

export type AppointmentsOrderBy = {
  appointment_date?: InputMaybe<OrderByDirection>;
  appointment_type?: InputMaybe<OrderByDirection>;
  clinic_id?: InputMaybe<OrderByDirection>;
  confirmation_date?: InputMaybe<OrderByDirection>;
  confirmation_sent?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  end_time?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  internal_notes?: InputMaybe<OrderByDirection>;
  is_recurring?: InputMaybe<OrderByDirection>;
  notes?: InputMaybe<OrderByDirection>;
  patient_id?: InputMaybe<OrderByDirection>;
  professional_id?: InputMaybe<OrderByDirection>;
  reason?: InputMaybe<OrderByDirection>;
  reminder_date?: InputMaybe<OrderByDirection>;
  reminder_sent?: InputMaybe<OrderByDirection>;
  start_time?: InputMaybe<OrderByDirection>;
  status?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  workspace_id?: InputMaybe<OrderByDirection>;
};

export type AppointmentsUpdateInput = {
  appointment_date?: InputMaybe<Scalars['Date']['input']>;
  appointment_type?: InputMaybe<Scalars['String']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  confirmation_date?: InputMaybe<Scalars['Datetime']['input']>;
  confirmation_sent?: InputMaybe<Scalars['Boolean']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  end_time?: InputMaybe<Scalars['Time']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  internal_notes?: InputMaybe<Scalars['String']['input']>;
  is_recurring?: InputMaybe<Scalars['Boolean']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  professional_id?: InputMaybe<Scalars['UUID']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  recurring_pattern?: InputMaybe<Scalars['JSON']['input']>;
  reminder_date?: InputMaybe<Scalars['Datetime']['input']>;
  reminder_sent?: InputMaybe<Scalars['Boolean']['input']>;
  start_time?: InputMaybe<Scalars['Time']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type AppointmentsUpdateResponse = {
  __typename?: 'appointmentsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Appointments>;
};

export type Assessments = Node & {
  __typename?: 'assessments';
  clinic_configurations?: Maybe<Clinic_Configurations>;
  clinic_id: Scalars['UUID']['output'];
  clinical_notes?: Maybe<Scalars['String']['output']>;
  completion_time?: Maybe<Scalars['Datetime']['output']>;
  consultation_id?: Maybe<Scalars['UUID']['output']>;
  consultations?: Maybe<Consultations>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  id: Scalars['UUID']['output'];
  individual_workspaces?: Maybe<Individual_Workspaces>;
  interpretation_level?: Maybe<Scalars['String']['output']>;
  interpretation_text?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  patient_id: Scalars['UUID']['output'];
  patients?: Maybe<Patients>;
  percentile_score?: Maybe<Scalars['BigFloat']['output']>;
  professional_id?: Maybe<Scalars['UUID']['output']>;
  profiles?: Maybe<Profiles>;
  psychometric_scales?: Maybe<Psychometric_Scales>;
  responses?: Maybe<Scalars['JSON']['output']>;
  scale_id: Scalars['UUID']['output'];
  scoring_data?: Maybe<Scalars['JSON']['output']>;
  start_time?: Maybe<Scalars['Datetime']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  total_score?: Maybe<Scalars['BigFloat']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  workspace_id?: Maybe<Scalars['UUID']['output']>;
};

export type AssessmentsConnection = {
  __typename?: 'assessmentsConnection';
  edges: Array<AssessmentsEdge>;
  pageInfo: PageInfo;
};

export type AssessmentsDeleteResponse = {
  __typename?: 'assessmentsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Assessments>;
};

export type AssessmentsEdge = {
  __typename?: 'assessmentsEdge';
  cursor: Scalars['String']['output'];
  node: Assessments;
};

export type AssessmentsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<AssessmentsFilter>>;
  clinic_id?: InputMaybe<UuidFilter>;
  clinical_notes?: InputMaybe<StringFilter>;
  completion_time?: InputMaybe<DatetimeFilter>;
  consultation_id?: InputMaybe<UuidFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  interpretation_level?: InputMaybe<StringFilter>;
  interpretation_text?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<AssessmentsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<AssessmentsFilter>>;
  patient_id?: InputMaybe<UuidFilter>;
  percentile_score?: InputMaybe<BigFloatFilter>;
  professional_id?: InputMaybe<UuidFilter>;
  scale_id?: InputMaybe<UuidFilter>;
  start_time?: InputMaybe<DatetimeFilter>;
  status?: InputMaybe<StringFilter>;
  total_score?: InputMaybe<BigFloatFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  workspace_id?: InputMaybe<UuidFilter>;
};

export type AssessmentsInsertInput = {
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  clinical_notes?: InputMaybe<Scalars['String']['input']>;
  completion_time?: InputMaybe<Scalars['Datetime']['input']>;
  consultation_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  interpretation_level?: InputMaybe<Scalars['String']['input']>;
  interpretation_text?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  percentile_score?: InputMaybe<Scalars['BigFloat']['input']>;
  professional_id?: InputMaybe<Scalars['UUID']['input']>;
  responses?: InputMaybe<Scalars['JSON']['input']>;
  scale_id?: InputMaybe<Scalars['UUID']['input']>;
  scoring_data?: InputMaybe<Scalars['JSON']['input']>;
  start_time?: InputMaybe<Scalars['Datetime']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  total_score?: InputMaybe<Scalars['BigFloat']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type AssessmentsInsertResponse = {
  __typename?: 'assessmentsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Assessments>;
};

export type AssessmentsOrderBy = {
  clinic_id?: InputMaybe<OrderByDirection>;
  clinical_notes?: InputMaybe<OrderByDirection>;
  completion_time?: InputMaybe<OrderByDirection>;
  consultation_id?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  interpretation_level?: InputMaybe<OrderByDirection>;
  interpretation_text?: InputMaybe<OrderByDirection>;
  patient_id?: InputMaybe<OrderByDirection>;
  percentile_score?: InputMaybe<OrderByDirection>;
  professional_id?: InputMaybe<OrderByDirection>;
  scale_id?: InputMaybe<OrderByDirection>;
  start_time?: InputMaybe<OrderByDirection>;
  status?: InputMaybe<OrderByDirection>;
  total_score?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  workspace_id?: InputMaybe<OrderByDirection>;
};

export type AssessmentsUpdateInput = {
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  clinical_notes?: InputMaybe<Scalars['String']['input']>;
  completion_time?: InputMaybe<Scalars['Datetime']['input']>;
  consultation_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  interpretation_level?: InputMaybe<Scalars['String']['input']>;
  interpretation_text?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  percentile_score?: InputMaybe<Scalars['BigFloat']['input']>;
  professional_id?: InputMaybe<Scalars['UUID']['input']>;
  responses?: InputMaybe<Scalars['JSON']['input']>;
  scale_id?: InputMaybe<Scalars['UUID']['input']>;
  scoring_data?: InputMaybe<Scalars['JSON']['input']>;
  start_time?: InputMaybe<Scalars['Datetime']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  total_score?: InputMaybe<Scalars['BigFloat']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type AssessmentsUpdateResponse = {
  __typename?: 'assessmentsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Assessments>;
};

export type Auth_Group = Node & {
  __typename?: 'auth_group';
  auth_group_permissionsCollection?: Maybe<Auth_Group_PermissionsConnection>;
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
};


export type Auth_GroupAuth_Group_PermissionsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Auth_Group_PermissionsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Auth_Group_PermissionsOrderBy>>;
};

export type Auth_GroupConnection = {
  __typename?: 'auth_groupConnection';
  edges: Array<Auth_GroupEdge>;
  pageInfo: PageInfo;
};

export type Auth_GroupDeleteResponse = {
  __typename?: 'auth_groupDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Auth_Group>;
};

export type Auth_GroupEdge = {
  __typename?: 'auth_groupEdge';
  cursor: Scalars['String']['output'];
  node: Auth_Group;
};

export type Auth_GroupFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Auth_GroupFilter>>;
  id?: InputMaybe<IntFilter>;
  name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Auth_GroupFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Auth_GroupFilter>>;
};

export type Auth_GroupInsertInput = {
  name?: InputMaybe<Scalars['String']['input']>;
};

export type Auth_GroupInsertResponse = {
  __typename?: 'auth_groupInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Auth_Group>;
};

export type Auth_GroupOrderBy = {
  id?: InputMaybe<OrderByDirection>;
  name?: InputMaybe<OrderByDirection>;
};

export type Auth_GroupUpdateInput = {
  name?: InputMaybe<Scalars['String']['input']>;
};

export type Auth_GroupUpdateResponse = {
  __typename?: 'auth_groupUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Auth_Group>;
};

export type Auth_Group_Permissions = Node & {
  __typename?: 'auth_group_permissions';
  auth_group?: Maybe<Auth_Group>;
  auth_permission?: Maybe<Auth_Permission>;
  group_id: Scalars['Int']['output'];
  id: Scalars['BigInt']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  permission_id: Scalars['Int']['output'];
};

export type Auth_Group_PermissionsConnection = {
  __typename?: 'auth_group_permissionsConnection';
  edges: Array<Auth_Group_PermissionsEdge>;
  pageInfo: PageInfo;
};

export type Auth_Group_PermissionsDeleteResponse = {
  __typename?: 'auth_group_permissionsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Auth_Group_Permissions>;
};

export type Auth_Group_PermissionsEdge = {
  __typename?: 'auth_group_permissionsEdge';
  cursor: Scalars['String']['output'];
  node: Auth_Group_Permissions;
};

export type Auth_Group_PermissionsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Auth_Group_PermissionsFilter>>;
  group_id?: InputMaybe<IntFilter>;
  id?: InputMaybe<BigIntFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Auth_Group_PermissionsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Auth_Group_PermissionsFilter>>;
  permission_id?: InputMaybe<IntFilter>;
};

export type Auth_Group_PermissionsInsertInput = {
  group_id?: InputMaybe<Scalars['Int']['input']>;
  permission_id?: InputMaybe<Scalars['Int']['input']>;
};

export type Auth_Group_PermissionsInsertResponse = {
  __typename?: 'auth_group_permissionsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Auth_Group_Permissions>;
};

export type Auth_Group_PermissionsOrderBy = {
  group_id?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  permission_id?: InputMaybe<OrderByDirection>;
};

export type Auth_Group_PermissionsUpdateInput = {
  group_id?: InputMaybe<Scalars['Int']['input']>;
  permission_id?: InputMaybe<Scalars['Int']['input']>;
};

export type Auth_Group_PermissionsUpdateResponse = {
  __typename?: 'auth_group_permissionsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Auth_Group_Permissions>;
};

export type Auth_Permission = Node & {
  __typename?: 'auth_permission';
  auth_group_permissionsCollection?: Maybe<Auth_Group_PermissionsConnection>;
  codename: Scalars['String']['output'];
  content_type_id: Scalars['Int']['output'];
  django_content_type?: Maybe<Django_Content_Type>;
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
};


export type Auth_PermissionAuth_Group_PermissionsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Auth_Group_PermissionsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Auth_Group_PermissionsOrderBy>>;
};

export type Auth_PermissionConnection = {
  __typename?: 'auth_permissionConnection';
  edges: Array<Auth_PermissionEdge>;
  pageInfo: PageInfo;
};

export type Auth_PermissionDeleteResponse = {
  __typename?: 'auth_permissionDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Auth_Permission>;
};

export type Auth_PermissionEdge = {
  __typename?: 'auth_permissionEdge';
  cursor: Scalars['String']['output'];
  node: Auth_Permission;
};

export type Auth_PermissionFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Auth_PermissionFilter>>;
  codename?: InputMaybe<StringFilter>;
  content_type_id?: InputMaybe<IntFilter>;
  id?: InputMaybe<IntFilter>;
  name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Auth_PermissionFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Auth_PermissionFilter>>;
};

export type Auth_PermissionInsertInput = {
  codename?: InputMaybe<Scalars['String']['input']>;
  content_type_id?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type Auth_PermissionInsertResponse = {
  __typename?: 'auth_permissionInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Auth_Permission>;
};

export type Auth_PermissionOrderBy = {
  codename?: InputMaybe<OrderByDirection>;
  content_type_id?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  name?: InputMaybe<OrderByDirection>;
};

export type Auth_PermissionUpdateInput = {
  codename?: InputMaybe<Scalars['String']['input']>;
  content_type_id?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type Auth_PermissionUpdateResponse = {
  __typename?: 'auth_permissionUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Auth_Permission>;
};

export type Clinic_Configurations = Node & {
  __typename?: 'clinic_configurations';
  address?: Maybe<Scalars['String']['output']>;
  appointmentsCollection?: Maybe<AppointmentsConnection>;
  assessmentsCollection?: Maybe<AssessmentsConnection>;
  clinic_name: Scalars['String']['output'];
  clinic_profilesCollection?: Maybe<Clinic_ProfilesConnection>;
  consultationsCollection?: Maybe<ConsultationsConnection>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  dynamic_formsCollection?: Maybe<Dynamic_FormsConnection>;
  email?: Maybe<Scalars['String']['output']>;
  form_submissionsCollection?: Maybe<Form_SubmissionsConnection>;
  id: Scalars['UUID']['output'];
  logo_url?: Maybe<Scalars['String']['output']>;
  medical_historyCollection?: Maybe<Medical_HistoryConnection>;
  medical_resourcesCollection?: Maybe<Medical_ResourcesConnection>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  patientsCollection?: Maybe<PatientsConnection>;
  phone?: Maybe<Scalars['String']['output']>;
  practice_locationsCollection?: Maybe<Practice_LocationsConnection>;
  prescriptionsCollection?: Maybe<PrescriptionsConnection>;
  psychometric_scalesCollection?: Maybe<Psychometric_ScalesConnection>;
  resource_categoriesCollection?: Maybe<Resource_CategoriesConnection>;
  scale_itemsCollection?: Maybe<Scale_ItemsConnection>;
  settings?: Maybe<Scalars['JSON']['output']>;
  tax_id?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
};


export type Clinic_ConfigurationsAppointmentsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<AppointmentsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<AppointmentsOrderBy>>;
};


export type Clinic_ConfigurationsAssessmentsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<AssessmentsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<AssessmentsOrderBy>>;
};


export type Clinic_ConfigurationsClinic_ProfilesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Clinic_ProfilesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Clinic_ProfilesOrderBy>>;
};


export type Clinic_ConfigurationsConsultationsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ConsultationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ConsultationsOrderBy>>;
};


export type Clinic_ConfigurationsDynamic_FormsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Dynamic_FormsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Dynamic_FormsOrderBy>>;
};


export type Clinic_ConfigurationsForm_SubmissionsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Form_SubmissionsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Form_SubmissionsOrderBy>>;
};


export type Clinic_ConfigurationsMedical_HistoryCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Medical_HistoryFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Medical_HistoryOrderBy>>;
};


export type Clinic_ConfigurationsMedical_ResourcesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Medical_ResourcesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Medical_ResourcesOrderBy>>;
};


export type Clinic_ConfigurationsPatientsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<PatientsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<PatientsOrderBy>>;
};


export type Clinic_ConfigurationsPractice_LocationsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Practice_LocationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Practice_LocationsOrderBy>>;
};


export type Clinic_ConfigurationsPrescriptionsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<PrescriptionsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<PrescriptionsOrderBy>>;
};


export type Clinic_ConfigurationsPsychometric_ScalesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Psychometric_ScalesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Psychometric_ScalesOrderBy>>;
};


export type Clinic_ConfigurationsResource_CategoriesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Resource_CategoriesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Resource_CategoriesOrderBy>>;
};


export type Clinic_ConfigurationsScale_ItemsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Scale_ItemsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Scale_ItemsOrderBy>>;
};

export type Clinic_ConfigurationsConnection = {
  __typename?: 'clinic_configurationsConnection';
  edges: Array<Clinic_ConfigurationsEdge>;
  pageInfo: PageInfo;
};

export type Clinic_ConfigurationsDeleteResponse = {
  __typename?: 'clinic_configurationsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinic_Configurations>;
};

export type Clinic_ConfigurationsEdge = {
  __typename?: 'clinic_configurationsEdge';
  cursor: Scalars['String']['output'];
  node: Clinic_Configurations;
};

export type Clinic_ConfigurationsFilter = {
  address?: InputMaybe<StringFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Clinic_ConfigurationsFilter>>;
  clinic_name?: InputMaybe<StringFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  email?: InputMaybe<StringFilter>;
  id?: InputMaybe<UuidFilter>;
  logo_url?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Clinic_ConfigurationsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Clinic_ConfigurationsFilter>>;
  phone?: InputMaybe<StringFilter>;
  tax_id?: InputMaybe<StringFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
};

export type Clinic_ConfigurationsInsertInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  clinic_name?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  logo_url?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  settings?: InputMaybe<Scalars['JSON']['input']>;
  tax_id?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type Clinic_ConfigurationsInsertResponse = {
  __typename?: 'clinic_configurationsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinic_Configurations>;
};

export type Clinic_ConfigurationsOrderBy = {
  address?: InputMaybe<OrderByDirection>;
  clinic_name?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  email?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  logo_url?: InputMaybe<OrderByDirection>;
  phone?: InputMaybe<OrderByDirection>;
  tax_id?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
};

export type Clinic_ConfigurationsUpdateInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  clinic_name?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  logo_url?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  settings?: InputMaybe<Scalars['JSON']['input']>;
  tax_id?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type Clinic_ConfigurationsUpdateResponse = {
  __typename?: 'clinic_configurationsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinic_Configurations>;
};

export type Clinic_Invitations = Node & {
  __typename?: 'clinic_invitations';
  clinic_id: Scalars['UUID']['output'];
  clinics?: Maybe<Clinics>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  email: Scalars['String']['output'];
  expires_at: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  invited_by: Scalars['UUID']['output'];
  is_used?: Maybe<Scalars['Boolean']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  role?: Maybe<Scalars['String']['output']>;
  token: Scalars['String']['output'];
  used_at?: Maybe<Scalars['Datetime']['output']>;
};

export type Clinic_InvitationsConnection = {
  __typename?: 'clinic_invitationsConnection';
  edges: Array<Clinic_InvitationsEdge>;
  pageInfo: PageInfo;
};

export type Clinic_InvitationsDeleteResponse = {
  __typename?: 'clinic_invitationsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinic_Invitations>;
};

export type Clinic_InvitationsEdge = {
  __typename?: 'clinic_invitationsEdge';
  cursor: Scalars['String']['output'];
  node: Clinic_Invitations;
};

export type Clinic_InvitationsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Clinic_InvitationsFilter>>;
  clinic_id?: InputMaybe<UuidFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  email?: InputMaybe<StringFilter>;
  expires_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  invited_by?: InputMaybe<UuidFilter>;
  is_used?: InputMaybe<BooleanFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Clinic_InvitationsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Clinic_InvitationsFilter>>;
  role?: InputMaybe<StringFilter>;
  token?: InputMaybe<StringFilter>;
  used_at?: InputMaybe<DatetimeFilter>;
};

export type Clinic_InvitationsInsertInput = {
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  expires_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  invited_by?: InputMaybe<Scalars['UUID']['input']>;
  is_used?: InputMaybe<Scalars['Boolean']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
  token?: InputMaybe<Scalars['String']['input']>;
  used_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type Clinic_InvitationsInsertResponse = {
  __typename?: 'clinic_invitationsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinic_Invitations>;
};

export type Clinic_InvitationsOrderBy = {
  clinic_id?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  email?: InputMaybe<OrderByDirection>;
  expires_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  invited_by?: InputMaybe<OrderByDirection>;
  is_used?: InputMaybe<OrderByDirection>;
  role?: InputMaybe<OrderByDirection>;
  token?: InputMaybe<OrderByDirection>;
  used_at?: InputMaybe<OrderByDirection>;
};

export type Clinic_InvitationsUpdateInput = {
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  expires_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  invited_by?: InputMaybe<Scalars['UUID']['input']>;
  is_used?: InputMaybe<Scalars['Boolean']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
  token?: InputMaybe<Scalars['String']['input']>;
  used_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type Clinic_InvitationsUpdateResponse = {
  __typename?: 'clinic_invitationsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinic_Invitations>;
};

export type Clinic_Profiles = Node & {
  __typename?: 'clinic_profiles';
  bio?: Maybe<Scalars['String']['output']>;
  clinic_configurations?: Maybe<Clinic_Configurations>;
  clinic_id: Scalars['UUID']['output'];
  clinic_role?: Maybe<Scalars['String']['output']>;
  consultation_fee?: Maybe<Scalars['BigFloat']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  id: Scalars['UUID']['output'];
  is_active?: Maybe<Scalars['Boolean']['output']>;
  license_number?: Maybe<Scalars['String']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  permissions?: Maybe<Scalars['JSON']['output']>;
  professional_title?: Maybe<Scalars['String']['output']>;
  specialties?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
};

export type Clinic_ProfilesConnection = {
  __typename?: 'clinic_profilesConnection';
  edges: Array<Clinic_ProfilesEdge>;
  pageInfo: PageInfo;
};

export type Clinic_ProfilesDeleteResponse = {
  __typename?: 'clinic_profilesDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinic_Profiles>;
};

export type Clinic_ProfilesEdge = {
  __typename?: 'clinic_profilesEdge';
  cursor: Scalars['String']['output'];
  node: Clinic_Profiles;
};

export type Clinic_ProfilesFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Clinic_ProfilesFilter>>;
  bio?: InputMaybe<StringFilter>;
  clinic_id?: InputMaybe<UuidFilter>;
  clinic_role?: InputMaybe<StringFilter>;
  consultation_fee?: InputMaybe<BigFloatFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  is_active?: InputMaybe<BooleanFilter>;
  license_number?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Clinic_ProfilesFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Clinic_ProfilesFilter>>;
  professional_title?: InputMaybe<StringFilter>;
  specialties?: InputMaybe<StringListFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
};

export type Clinic_ProfilesInsertInput = {
  bio?: InputMaybe<Scalars['String']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  clinic_role?: InputMaybe<Scalars['String']['input']>;
  consultation_fee?: InputMaybe<Scalars['BigFloat']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  license_number?: InputMaybe<Scalars['String']['input']>;
  permissions?: InputMaybe<Scalars['JSON']['input']>;
  professional_title?: InputMaybe<Scalars['String']['input']>;
  specialties?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type Clinic_ProfilesInsertResponse = {
  __typename?: 'clinic_profilesInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinic_Profiles>;
};

export type Clinic_ProfilesOrderBy = {
  bio?: InputMaybe<OrderByDirection>;
  clinic_id?: InputMaybe<OrderByDirection>;
  clinic_role?: InputMaybe<OrderByDirection>;
  consultation_fee?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  is_active?: InputMaybe<OrderByDirection>;
  license_number?: InputMaybe<OrderByDirection>;
  professional_title?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
};

export type Clinic_ProfilesUpdateInput = {
  bio?: InputMaybe<Scalars['String']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  clinic_role?: InputMaybe<Scalars['String']['input']>;
  consultation_fee?: InputMaybe<Scalars['BigFloat']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  license_number?: InputMaybe<Scalars['String']['input']>;
  permissions?: InputMaybe<Scalars['JSON']['input']>;
  professional_title?: InputMaybe<Scalars['String']['input']>;
  specialties?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type Clinic_ProfilesUpdateResponse = {
  __typename?: 'clinic_profilesUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinic_Profiles>;
};

export type Clinics = Node & {
  __typename?: 'clinics';
  address?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  clinic_invitationsCollection?: Maybe<Clinic_InvitationsConnection>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  created_by?: Maybe<Scalars['UUID']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  finance_cash_register_cutsCollection?: Maybe<Finance_Cash_Register_CutsConnection>;
  finance_incomeCollection?: Maybe<Finance_IncomeConnection>;
  finance_payment_method_configCollection?: Maybe<Finance_Payment_Method_ConfigConnection>;
  finance_servicesCollection?: Maybe<Finance_ServicesConnection>;
  id: Scalars['UUID']['output'];
  is_active?: Maybe<Scalars['Boolean']['output']>;
  legal_name?: Maybe<Scalars['String']['output']>;
  license_number?: Maybe<Scalars['String']['output']>;
  max_patients?: Maybe<Scalars['Int']['output']>;
  max_users?: Maybe<Scalars['Int']['output']>;
  medical_access_logCollection?: Maybe<Medical_Access_LogConnection>;
  medical_audit_logCollection?: Maybe<Medical_Audit_LogConnection>;
  medical_compliance_reportsCollection?: Maybe<Medical_Compliance_ReportsConnection>;
  name: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  phone?: Maybe<Scalars['String']['output']>;
  postal_code?: Maybe<Scalars['String']['output']>;
  profilesCollection?: Maybe<ProfilesConnection>;
  rfc?: Maybe<Scalars['String']['output']>;
  state?: Maybe<Scalars['String']['output']>;
  subscription_plan?: Maybe<Scalars['String']['output']>;
  tenant_membershipsCollection?: Maybe<Tenant_MembershipsConnection>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  website?: Maybe<Scalars['String']['output']>;
};


export type ClinicsClinic_InvitationsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Clinic_InvitationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Clinic_InvitationsOrderBy>>;
};


export type ClinicsFinance_Cash_Register_CutsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Finance_Cash_Register_CutsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Finance_Cash_Register_CutsOrderBy>>;
};


export type ClinicsFinance_IncomeCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Finance_IncomeFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Finance_IncomeOrderBy>>;
};


export type ClinicsFinance_Payment_Method_ConfigCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Finance_Payment_Method_ConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Finance_Payment_Method_ConfigOrderBy>>;
};


export type ClinicsFinance_ServicesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Finance_ServicesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Finance_ServicesOrderBy>>;
};


export type ClinicsMedical_Access_LogCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Medical_Access_LogFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Medical_Access_LogOrderBy>>;
};


export type ClinicsMedical_Audit_LogCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Medical_Audit_LogFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Medical_Audit_LogOrderBy>>;
};


export type ClinicsMedical_Compliance_ReportsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Medical_Compliance_ReportsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Medical_Compliance_ReportsOrderBy>>;
};


export type ClinicsProfilesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ProfilesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ProfilesOrderBy>>;
};


export type ClinicsTenant_MembershipsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Tenant_MembershipsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Tenant_MembershipsOrderBy>>;
};

export type ClinicsConnection = {
  __typename?: 'clinicsConnection';
  edges: Array<ClinicsEdge>;
  pageInfo: PageInfo;
};

export type ClinicsDeleteResponse = {
  __typename?: 'clinicsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinics>;
};

export type ClinicsEdge = {
  __typename?: 'clinicsEdge';
  cursor: Scalars['String']['output'];
  node: Clinics;
};

export type ClinicsFilter = {
  address?: InputMaybe<StringFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<ClinicsFilter>>;
  city?: InputMaybe<StringFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  created_by?: InputMaybe<UuidFilter>;
  email?: InputMaybe<StringFilter>;
  id?: InputMaybe<UuidFilter>;
  is_active?: InputMaybe<BooleanFilter>;
  legal_name?: InputMaybe<StringFilter>;
  license_number?: InputMaybe<StringFilter>;
  max_patients?: InputMaybe<IntFilter>;
  max_users?: InputMaybe<IntFilter>;
  name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<ClinicsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<ClinicsFilter>>;
  phone?: InputMaybe<StringFilter>;
  postal_code?: InputMaybe<StringFilter>;
  rfc?: InputMaybe<StringFilter>;
  state?: InputMaybe<StringFilter>;
  subscription_plan?: InputMaybe<StringFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  website?: InputMaybe<StringFilter>;
};

export type ClinicsInsertInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_by?: InputMaybe<Scalars['UUID']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  legal_name?: InputMaybe<Scalars['String']['input']>;
  license_number?: InputMaybe<Scalars['String']['input']>;
  max_patients?: InputMaybe<Scalars['Int']['input']>;
  max_users?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  postal_code?: InputMaybe<Scalars['String']['input']>;
  rfc?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  subscription_plan?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
};

export type ClinicsInsertResponse = {
  __typename?: 'clinicsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinics>;
};

export type ClinicsOrderBy = {
  address?: InputMaybe<OrderByDirection>;
  city?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  created_by?: InputMaybe<OrderByDirection>;
  email?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  is_active?: InputMaybe<OrderByDirection>;
  legal_name?: InputMaybe<OrderByDirection>;
  license_number?: InputMaybe<OrderByDirection>;
  max_patients?: InputMaybe<OrderByDirection>;
  max_users?: InputMaybe<OrderByDirection>;
  name?: InputMaybe<OrderByDirection>;
  phone?: InputMaybe<OrderByDirection>;
  postal_code?: InputMaybe<OrderByDirection>;
  rfc?: InputMaybe<OrderByDirection>;
  state?: InputMaybe<OrderByDirection>;
  subscription_plan?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  website?: InputMaybe<OrderByDirection>;
};

export type ClinicsUpdateInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_by?: InputMaybe<Scalars['UUID']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  legal_name?: InputMaybe<Scalars['String']['input']>;
  license_number?: InputMaybe<Scalars['String']['input']>;
  max_patients?: InputMaybe<Scalars['Int']['input']>;
  max_users?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  postal_code?: InputMaybe<Scalars['String']['input']>;
  rfc?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  subscription_plan?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
};

export type ClinicsUpdateResponse = {
  __typename?: 'clinicsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinics>;
};

export type Clinimetrix_Assessments = Node & {
  __typename?: 'clinimetrix_assessments';
  administrator_id?: Maybe<Scalars['UUID']['output']>;
  assessment_date?: Maybe<Scalars['Datetime']['output']>;
  clinical_notes?: Maybe<Scalars['String']['output']>;
  clinimetrix_remote_assessmentsCollection?: Maybe<Clinimetrix_Remote_AssessmentsConnection>;
  clinimetrix_responsesCollection?: Maybe<Clinimetrix_ResponsesConnection>;
  clinimetrix_templates?: Maybe<Clinimetrix_Templates>;
  completed_at?: Maybe<Scalars['Datetime']['output']>;
  completion_percentage?: Maybe<Scalars['Int']['output']>;
  completion_time_seconds?: Maybe<Scalars['Int']['output']>;
  consultation_id?: Maybe<Scalars['UUID']['output']>;
  consultations?: Maybe<Consultations>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  current_step?: Maybe<Scalars['Int']['output']>;
  id: Scalars['UUID']['output'];
  interpretation?: Maybe<Scalars['JSON']['output']>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  mode?: Maybe<Scalars['String']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  observations?: Maybe<Scalars['String']['output']>;
  patient_id?: Maybe<Scalars['UUID']['output']>;
  patients?: Maybe<Patients>;
  percentile?: Maybe<Scalars['Int']['output']>;
  responses?: Maybe<Scalars['JSON']['output']>;
  scores?: Maybe<Scalars['JSON']['output']>;
  severity_level?: Maybe<Scalars['String']['output']>;
  started_at?: Maybe<Scalars['Datetime']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  subscale_scores?: Maybe<Scalars['JSON']['output']>;
  template_id?: Maybe<Scalars['String']['output']>;
  time_taken_minutes?: Maybe<Scalars['Int']['output']>;
  total_score?: Maybe<Scalars['BigFloat']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  validity_indicators?: Maybe<Scalars['JSON']['output']>;
};


export type Clinimetrix_AssessmentsClinimetrix_Remote_AssessmentsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Clinimetrix_Remote_AssessmentsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Clinimetrix_Remote_AssessmentsOrderBy>>;
};


export type Clinimetrix_AssessmentsClinimetrix_ResponsesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Clinimetrix_ResponsesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Clinimetrix_ResponsesOrderBy>>;
};

export type Clinimetrix_AssessmentsConnection = {
  __typename?: 'clinimetrix_assessmentsConnection';
  edges: Array<Clinimetrix_AssessmentsEdge>;
  pageInfo: PageInfo;
};

export type Clinimetrix_AssessmentsDeleteResponse = {
  __typename?: 'clinimetrix_assessmentsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinimetrix_Assessments>;
};

export type Clinimetrix_AssessmentsEdge = {
  __typename?: 'clinimetrix_assessmentsEdge';
  cursor: Scalars['String']['output'];
  node: Clinimetrix_Assessments;
};

export type Clinimetrix_AssessmentsFilter = {
  administrator_id?: InputMaybe<UuidFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Clinimetrix_AssessmentsFilter>>;
  assessment_date?: InputMaybe<DatetimeFilter>;
  clinical_notes?: InputMaybe<StringFilter>;
  completed_at?: InputMaybe<DatetimeFilter>;
  completion_percentage?: InputMaybe<IntFilter>;
  completion_time_seconds?: InputMaybe<IntFilter>;
  consultation_id?: InputMaybe<UuidFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  current_step?: InputMaybe<IntFilter>;
  id?: InputMaybe<UuidFilter>;
  mode?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Clinimetrix_AssessmentsFilter>;
  notes?: InputMaybe<StringFilter>;
  observations?: InputMaybe<StringFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Clinimetrix_AssessmentsFilter>>;
  patient_id?: InputMaybe<UuidFilter>;
  percentile?: InputMaybe<IntFilter>;
  severity_level?: InputMaybe<StringFilter>;
  started_at?: InputMaybe<DatetimeFilter>;
  status?: InputMaybe<StringFilter>;
  template_id?: InputMaybe<StringFilter>;
  time_taken_minutes?: InputMaybe<IntFilter>;
  total_score?: InputMaybe<BigFloatFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
};

export type Clinimetrix_AssessmentsInsertInput = {
  administrator_id?: InputMaybe<Scalars['UUID']['input']>;
  assessment_date?: InputMaybe<Scalars['Datetime']['input']>;
  clinical_notes?: InputMaybe<Scalars['String']['input']>;
  completed_at?: InputMaybe<Scalars['Datetime']['input']>;
  completion_percentage?: InputMaybe<Scalars['Int']['input']>;
  completion_time_seconds?: InputMaybe<Scalars['Int']['input']>;
  consultation_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  current_step?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  interpretation?: InputMaybe<Scalars['JSON']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  mode?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  observations?: InputMaybe<Scalars['String']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  percentile?: InputMaybe<Scalars['Int']['input']>;
  responses?: InputMaybe<Scalars['JSON']['input']>;
  scores?: InputMaybe<Scalars['JSON']['input']>;
  severity_level?: InputMaybe<Scalars['String']['input']>;
  started_at?: InputMaybe<Scalars['Datetime']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  subscale_scores?: InputMaybe<Scalars['JSON']['input']>;
  template_id?: InputMaybe<Scalars['String']['input']>;
  time_taken_minutes?: InputMaybe<Scalars['Int']['input']>;
  total_score?: InputMaybe<Scalars['BigFloat']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  validity_indicators?: InputMaybe<Scalars['JSON']['input']>;
};

export type Clinimetrix_AssessmentsInsertResponse = {
  __typename?: 'clinimetrix_assessmentsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinimetrix_Assessments>;
};

export type Clinimetrix_AssessmentsOrderBy = {
  administrator_id?: InputMaybe<OrderByDirection>;
  assessment_date?: InputMaybe<OrderByDirection>;
  clinical_notes?: InputMaybe<OrderByDirection>;
  completed_at?: InputMaybe<OrderByDirection>;
  completion_percentage?: InputMaybe<OrderByDirection>;
  completion_time_seconds?: InputMaybe<OrderByDirection>;
  consultation_id?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  current_step?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  mode?: InputMaybe<OrderByDirection>;
  notes?: InputMaybe<OrderByDirection>;
  observations?: InputMaybe<OrderByDirection>;
  patient_id?: InputMaybe<OrderByDirection>;
  percentile?: InputMaybe<OrderByDirection>;
  severity_level?: InputMaybe<OrderByDirection>;
  started_at?: InputMaybe<OrderByDirection>;
  status?: InputMaybe<OrderByDirection>;
  template_id?: InputMaybe<OrderByDirection>;
  time_taken_minutes?: InputMaybe<OrderByDirection>;
  total_score?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
};

export type Clinimetrix_AssessmentsUpdateInput = {
  administrator_id?: InputMaybe<Scalars['UUID']['input']>;
  assessment_date?: InputMaybe<Scalars['Datetime']['input']>;
  clinical_notes?: InputMaybe<Scalars['String']['input']>;
  completed_at?: InputMaybe<Scalars['Datetime']['input']>;
  completion_percentage?: InputMaybe<Scalars['Int']['input']>;
  completion_time_seconds?: InputMaybe<Scalars['Int']['input']>;
  consultation_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  current_step?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  interpretation?: InputMaybe<Scalars['JSON']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  mode?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  observations?: InputMaybe<Scalars['String']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  percentile?: InputMaybe<Scalars['Int']['input']>;
  responses?: InputMaybe<Scalars['JSON']['input']>;
  scores?: InputMaybe<Scalars['JSON']['input']>;
  severity_level?: InputMaybe<Scalars['String']['input']>;
  started_at?: InputMaybe<Scalars['Datetime']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  subscale_scores?: InputMaybe<Scalars['JSON']['input']>;
  template_id?: InputMaybe<Scalars['String']['input']>;
  time_taken_minutes?: InputMaybe<Scalars['Int']['input']>;
  total_score?: InputMaybe<Scalars['BigFloat']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  validity_indicators?: InputMaybe<Scalars['JSON']['input']>;
};

export type Clinimetrix_AssessmentsUpdateResponse = {
  __typename?: 'clinimetrix_assessmentsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinimetrix_Assessments>;
};

export type Clinimetrix_Registry = Node & {
  __typename?: 'clinimetrix_registry';
  abbreviation: Scalars['String']['output'];
  administration_mode?: Maybe<Scalars['String']['output']>;
  authors?: Maybe<Scalars['JSON']['output']>;
  category?: Maybe<Scalars['String']['output']>;
  category_id?: Maybe<Scalars['BigInt']['output']>;
  clinical_validation?: Maybe<Scalars['JSON']['output']>;
  clinimetrix_scale_categories?: Maybe<Clinimetrix_Scale_Categories>;
  clinimetrix_templates?: Maybe<Clinimetrix_Templates>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  estimated_duration_minutes?: Maybe<Scalars['Int']['output']>;
  id: Scalars['String']['output'];
  is_active?: Maybe<Scalars['Boolean']['output']>;
  is_featured?: Maybe<Scalars['Boolean']['output']>;
  is_public?: Maybe<Scalars['Boolean']['output']>;
  language?: Maybe<Scalars['String']['output']>;
  last_validated?: Maybe<Scalars['Datetime']['output']>;
  name: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  psychometric_properties?: Maybe<Scalars['JSON']['output']>;
  score_range_max?: Maybe<Scalars['Int']['output']>;
  score_range_min?: Maybe<Scalars['Int']['output']>;
  subcategory?: Maybe<Scalars['String']['output']>;
  tags?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  target_population?: Maybe<Scalars['JSON']['output']>;
  template_id?: Maybe<Scalars['String']['output']>;
  total_items?: Maybe<Scalars['Int']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  version?: Maybe<Scalars['String']['output']>;
  year?: Maybe<Scalars['Int']['output']>;
};

export type Clinimetrix_RegistryConnection = {
  __typename?: 'clinimetrix_registryConnection';
  edges: Array<Clinimetrix_RegistryEdge>;
  pageInfo: PageInfo;
};

export type Clinimetrix_RegistryDeleteResponse = {
  __typename?: 'clinimetrix_registryDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinimetrix_Registry>;
};

export type Clinimetrix_RegistryEdge = {
  __typename?: 'clinimetrix_registryEdge';
  cursor: Scalars['String']['output'];
  node: Clinimetrix_Registry;
};

export type Clinimetrix_RegistryFilter = {
  abbreviation?: InputMaybe<StringFilter>;
  administration_mode?: InputMaybe<StringFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Clinimetrix_RegistryFilter>>;
  category?: InputMaybe<StringFilter>;
  category_id?: InputMaybe<BigIntFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  description?: InputMaybe<StringFilter>;
  estimated_duration_minutes?: InputMaybe<IntFilter>;
  id?: InputMaybe<StringFilter>;
  is_active?: InputMaybe<BooleanFilter>;
  is_featured?: InputMaybe<BooleanFilter>;
  is_public?: InputMaybe<BooleanFilter>;
  language?: InputMaybe<StringFilter>;
  last_validated?: InputMaybe<DatetimeFilter>;
  name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Clinimetrix_RegistryFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Clinimetrix_RegistryFilter>>;
  score_range_max?: InputMaybe<IntFilter>;
  score_range_min?: InputMaybe<IntFilter>;
  subcategory?: InputMaybe<StringFilter>;
  tags?: InputMaybe<StringListFilter>;
  template_id?: InputMaybe<StringFilter>;
  total_items?: InputMaybe<IntFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  version?: InputMaybe<StringFilter>;
  year?: InputMaybe<IntFilter>;
};

export type Clinimetrix_RegistryInsertInput = {
  abbreviation?: InputMaybe<Scalars['String']['input']>;
  administration_mode?: InputMaybe<Scalars['String']['input']>;
  authors?: InputMaybe<Scalars['JSON']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  category_id?: InputMaybe<Scalars['BigInt']['input']>;
  clinical_validation?: InputMaybe<Scalars['JSON']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  estimated_duration_minutes?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  is_featured?: InputMaybe<Scalars['Boolean']['input']>;
  is_public?: InputMaybe<Scalars['Boolean']['input']>;
  language?: InputMaybe<Scalars['String']['input']>;
  last_validated?: InputMaybe<Scalars['Datetime']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  psychometric_properties?: InputMaybe<Scalars['JSON']['input']>;
  score_range_max?: InputMaybe<Scalars['Int']['input']>;
  score_range_min?: InputMaybe<Scalars['Int']['input']>;
  subcategory?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  target_population?: InputMaybe<Scalars['JSON']['input']>;
  template_id?: InputMaybe<Scalars['String']['input']>;
  total_items?: InputMaybe<Scalars['Int']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
  year?: InputMaybe<Scalars['Int']['input']>;
};

export type Clinimetrix_RegistryInsertResponse = {
  __typename?: 'clinimetrix_registryInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinimetrix_Registry>;
};

export type Clinimetrix_RegistryOrderBy = {
  abbreviation?: InputMaybe<OrderByDirection>;
  administration_mode?: InputMaybe<OrderByDirection>;
  category?: InputMaybe<OrderByDirection>;
  category_id?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  description?: InputMaybe<OrderByDirection>;
  estimated_duration_minutes?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  is_active?: InputMaybe<OrderByDirection>;
  is_featured?: InputMaybe<OrderByDirection>;
  is_public?: InputMaybe<OrderByDirection>;
  language?: InputMaybe<OrderByDirection>;
  last_validated?: InputMaybe<OrderByDirection>;
  name?: InputMaybe<OrderByDirection>;
  score_range_max?: InputMaybe<OrderByDirection>;
  score_range_min?: InputMaybe<OrderByDirection>;
  subcategory?: InputMaybe<OrderByDirection>;
  template_id?: InputMaybe<OrderByDirection>;
  total_items?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  version?: InputMaybe<OrderByDirection>;
  year?: InputMaybe<OrderByDirection>;
};

export type Clinimetrix_RegistryUpdateInput = {
  abbreviation?: InputMaybe<Scalars['String']['input']>;
  administration_mode?: InputMaybe<Scalars['String']['input']>;
  authors?: InputMaybe<Scalars['JSON']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  category_id?: InputMaybe<Scalars['BigInt']['input']>;
  clinical_validation?: InputMaybe<Scalars['JSON']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  estimated_duration_minutes?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  is_featured?: InputMaybe<Scalars['Boolean']['input']>;
  is_public?: InputMaybe<Scalars['Boolean']['input']>;
  language?: InputMaybe<Scalars['String']['input']>;
  last_validated?: InputMaybe<Scalars['Datetime']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  psychometric_properties?: InputMaybe<Scalars['JSON']['input']>;
  score_range_max?: InputMaybe<Scalars['Int']['input']>;
  score_range_min?: InputMaybe<Scalars['Int']['input']>;
  subcategory?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  target_population?: InputMaybe<Scalars['JSON']['input']>;
  template_id?: InputMaybe<Scalars['String']['input']>;
  total_items?: InputMaybe<Scalars['Int']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
  year?: InputMaybe<Scalars['Int']['input']>;
};

export type Clinimetrix_RegistryUpdateResponse = {
  __typename?: 'clinimetrix_registryUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinimetrix_Registry>;
};

export type Clinimetrix_Remote_Assessments = Node & {
  __typename?: 'clinimetrix_remote_assessments';
  access_pin?: Maybe<Scalars['String']['output']>;
  access_token: Scalars['String']['output'];
  accessed_at?: Maybe<Scalars['Datetime']['output']>;
  assessment_id?: Maybe<Scalars['UUID']['output']>;
  clinimetrix_assessments?: Maybe<Clinimetrix_Assessments>;
  clinimetrix_templates?: Maybe<Clinimetrix_Templates>;
  completed_at?: Maybe<Scalars['Datetime']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  expires_at?: Maybe<Scalars['Datetime']['output']>;
  id: Scalars['UUID']['output'];
  instructions?: Maybe<Scalars['String']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  patient_id?: Maybe<Scalars['UUID']['output']>;
  patients?: Maybe<Patients>;
  reminder_sent?: Maybe<Scalars['Boolean']['output']>;
  scheduled_for?: Maybe<Scalars['Datetime']['output']>;
  sent_by?: Maybe<Scalars['UUID']['output']>;
  sent_to_email?: Maybe<Scalars['String']['output']>;
  sent_to_phone?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  template_id?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
};

export type Clinimetrix_Remote_AssessmentsConnection = {
  __typename?: 'clinimetrix_remote_assessmentsConnection';
  edges: Array<Clinimetrix_Remote_AssessmentsEdge>;
  pageInfo: PageInfo;
};

export type Clinimetrix_Remote_AssessmentsDeleteResponse = {
  __typename?: 'clinimetrix_remote_assessmentsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinimetrix_Remote_Assessments>;
};

export type Clinimetrix_Remote_AssessmentsEdge = {
  __typename?: 'clinimetrix_remote_assessmentsEdge';
  cursor: Scalars['String']['output'];
  node: Clinimetrix_Remote_Assessments;
};

export type Clinimetrix_Remote_AssessmentsFilter = {
  access_pin?: InputMaybe<StringFilter>;
  access_token?: InputMaybe<StringFilter>;
  accessed_at?: InputMaybe<DatetimeFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Clinimetrix_Remote_AssessmentsFilter>>;
  assessment_id?: InputMaybe<UuidFilter>;
  completed_at?: InputMaybe<DatetimeFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  expires_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  instructions?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Clinimetrix_Remote_AssessmentsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Clinimetrix_Remote_AssessmentsFilter>>;
  patient_id?: InputMaybe<UuidFilter>;
  reminder_sent?: InputMaybe<BooleanFilter>;
  scheduled_for?: InputMaybe<DatetimeFilter>;
  sent_by?: InputMaybe<UuidFilter>;
  sent_to_email?: InputMaybe<StringFilter>;
  sent_to_phone?: InputMaybe<StringFilter>;
  status?: InputMaybe<StringFilter>;
  template_id?: InputMaybe<StringFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
};

export type Clinimetrix_Remote_AssessmentsInsertInput = {
  access_pin?: InputMaybe<Scalars['String']['input']>;
  access_token?: InputMaybe<Scalars['String']['input']>;
  accessed_at?: InputMaybe<Scalars['Datetime']['input']>;
  assessment_id?: InputMaybe<Scalars['UUID']['input']>;
  completed_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  expires_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  instructions?: InputMaybe<Scalars['String']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  reminder_sent?: InputMaybe<Scalars['Boolean']['input']>;
  scheduled_for?: InputMaybe<Scalars['Datetime']['input']>;
  sent_by?: InputMaybe<Scalars['UUID']['input']>;
  sent_to_email?: InputMaybe<Scalars['String']['input']>;
  sent_to_phone?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  template_id?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type Clinimetrix_Remote_AssessmentsInsertResponse = {
  __typename?: 'clinimetrix_remote_assessmentsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinimetrix_Remote_Assessments>;
};

export type Clinimetrix_Remote_AssessmentsOrderBy = {
  access_pin?: InputMaybe<OrderByDirection>;
  access_token?: InputMaybe<OrderByDirection>;
  accessed_at?: InputMaybe<OrderByDirection>;
  assessment_id?: InputMaybe<OrderByDirection>;
  completed_at?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  expires_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  instructions?: InputMaybe<OrderByDirection>;
  patient_id?: InputMaybe<OrderByDirection>;
  reminder_sent?: InputMaybe<OrderByDirection>;
  scheduled_for?: InputMaybe<OrderByDirection>;
  sent_by?: InputMaybe<OrderByDirection>;
  sent_to_email?: InputMaybe<OrderByDirection>;
  sent_to_phone?: InputMaybe<OrderByDirection>;
  status?: InputMaybe<OrderByDirection>;
  template_id?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
};

export type Clinimetrix_Remote_AssessmentsUpdateInput = {
  access_pin?: InputMaybe<Scalars['String']['input']>;
  access_token?: InputMaybe<Scalars['String']['input']>;
  accessed_at?: InputMaybe<Scalars['Datetime']['input']>;
  assessment_id?: InputMaybe<Scalars['UUID']['input']>;
  completed_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  expires_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  instructions?: InputMaybe<Scalars['String']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  reminder_sent?: InputMaybe<Scalars['Boolean']['input']>;
  scheduled_for?: InputMaybe<Scalars['Datetime']['input']>;
  sent_by?: InputMaybe<Scalars['UUID']['input']>;
  sent_to_email?: InputMaybe<Scalars['String']['input']>;
  sent_to_phone?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  template_id?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type Clinimetrix_Remote_AssessmentsUpdateResponse = {
  __typename?: 'clinimetrix_remote_assessmentsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinimetrix_Remote_Assessments>;
};

export type Clinimetrix_Responses = Node & {
  __typename?: 'clinimetrix_responses';
  assessment_id?: Maybe<Scalars['UUID']['output']>;
  clinimetrix_assessments?: Maybe<Clinimetrix_Assessments>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  id: Scalars['UUID']['output'];
  item_id?: Maybe<Scalars['String']['output']>;
  item_number: Scalars['Int']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  response_score?: Maybe<Scalars['BigFloat']['output']>;
  response_text?: Maybe<Scalars['String']['output']>;
  response_time_ms?: Maybe<Scalars['Int']['output']>;
  response_value?: Maybe<Scalars['JSON']['output']>;
};

export type Clinimetrix_ResponsesConnection = {
  __typename?: 'clinimetrix_responsesConnection';
  edges: Array<Clinimetrix_ResponsesEdge>;
  pageInfo: PageInfo;
};

export type Clinimetrix_ResponsesDeleteResponse = {
  __typename?: 'clinimetrix_responsesDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinimetrix_Responses>;
};

export type Clinimetrix_ResponsesEdge = {
  __typename?: 'clinimetrix_responsesEdge';
  cursor: Scalars['String']['output'];
  node: Clinimetrix_Responses;
};

export type Clinimetrix_ResponsesFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Clinimetrix_ResponsesFilter>>;
  assessment_id?: InputMaybe<UuidFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  item_id?: InputMaybe<StringFilter>;
  item_number?: InputMaybe<IntFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Clinimetrix_ResponsesFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Clinimetrix_ResponsesFilter>>;
  response_score?: InputMaybe<BigFloatFilter>;
  response_text?: InputMaybe<StringFilter>;
  response_time_ms?: InputMaybe<IntFilter>;
};

export type Clinimetrix_ResponsesInsertInput = {
  assessment_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  item_id?: InputMaybe<Scalars['String']['input']>;
  item_number?: InputMaybe<Scalars['Int']['input']>;
  response_score?: InputMaybe<Scalars['BigFloat']['input']>;
  response_text?: InputMaybe<Scalars['String']['input']>;
  response_time_ms?: InputMaybe<Scalars['Int']['input']>;
  response_value?: InputMaybe<Scalars['JSON']['input']>;
};

export type Clinimetrix_ResponsesInsertResponse = {
  __typename?: 'clinimetrix_responsesInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinimetrix_Responses>;
};

export type Clinimetrix_ResponsesOrderBy = {
  assessment_id?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  item_id?: InputMaybe<OrderByDirection>;
  item_number?: InputMaybe<OrderByDirection>;
  response_score?: InputMaybe<OrderByDirection>;
  response_text?: InputMaybe<OrderByDirection>;
  response_time_ms?: InputMaybe<OrderByDirection>;
};

export type Clinimetrix_ResponsesUpdateInput = {
  assessment_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  item_id?: InputMaybe<Scalars['String']['input']>;
  item_number?: InputMaybe<Scalars['Int']['input']>;
  response_score?: InputMaybe<Scalars['BigFloat']['input']>;
  response_text?: InputMaybe<Scalars['String']['input']>;
  response_time_ms?: InputMaybe<Scalars['Int']['input']>;
  response_value?: InputMaybe<Scalars['JSON']['input']>;
};

export type Clinimetrix_ResponsesUpdateResponse = {
  __typename?: 'clinimetrix_responsesUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinimetrix_Responses>;
};

export type Clinimetrix_Scale_Categories = Node & {
  __typename?: 'clinimetrix_scale_categories';
  clinimetrix_registryCollection?: Maybe<Clinimetrix_RegistryConnection>;
  color?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['BigInt']['output'];
  name: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  updated_at?: Maybe<Scalars['Datetime']['output']>;
};


export type Clinimetrix_Scale_CategoriesClinimetrix_RegistryCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Clinimetrix_RegistryFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Clinimetrix_RegistryOrderBy>>;
};

export type Clinimetrix_Scale_CategoriesConnection = {
  __typename?: 'clinimetrix_scale_categoriesConnection';
  edges: Array<Clinimetrix_Scale_CategoriesEdge>;
  pageInfo: PageInfo;
};

export type Clinimetrix_Scale_CategoriesDeleteResponse = {
  __typename?: 'clinimetrix_scale_categoriesDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinimetrix_Scale_Categories>;
};

export type Clinimetrix_Scale_CategoriesEdge = {
  __typename?: 'clinimetrix_scale_categoriesEdge';
  cursor: Scalars['String']['output'];
  node: Clinimetrix_Scale_Categories;
};

export type Clinimetrix_Scale_CategoriesFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Clinimetrix_Scale_CategoriesFilter>>;
  color?: InputMaybe<StringFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  description?: InputMaybe<StringFilter>;
  icon?: InputMaybe<StringFilter>;
  id?: InputMaybe<BigIntFilter>;
  name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Clinimetrix_Scale_CategoriesFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Clinimetrix_Scale_CategoriesFilter>>;
  updated_at?: InputMaybe<DatetimeFilter>;
};

export type Clinimetrix_Scale_CategoriesInsertInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type Clinimetrix_Scale_CategoriesInsertResponse = {
  __typename?: 'clinimetrix_scale_categoriesInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinimetrix_Scale_Categories>;
};

export type Clinimetrix_Scale_CategoriesOrderBy = {
  color?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  description?: InputMaybe<OrderByDirection>;
  icon?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  name?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
};

export type Clinimetrix_Scale_CategoriesUpdateInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type Clinimetrix_Scale_CategoriesUpdateResponse = {
  __typename?: 'clinimetrix_scale_categoriesUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinimetrix_Scale_Categories>;
};

export type Clinimetrix_Scale_Tags = Node & {
  __typename?: 'clinimetrix_scale_tags';
  color?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  created_by_id?: Maybe<Scalars['UUID']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['BigInt']['output'];
  is_system?: Maybe<Scalars['Boolean']['output']>;
  name: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  slug: Scalars['String']['output'];
  tag_type?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
};

export type Clinimetrix_Scale_TagsConnection = {
  __typename?: 'clinimetrix_scale_tagsConnection';
  edges: Array<Clinimetrix_Scale_TagsEdge>;
  pageInfo: PageInfo;
};

export type Clinimetrix_Scale_TagsDeleteResponse = {
  __typename?: 'clinimetrix_scale_tagsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinimetrix_Scale_Tags>;
};

export type Clinimetrix_Scale_TagsEdge = {
  __typename?: 'clinimetrix_scale_tagsEdge';
  cursor: Scalars['String']['output'];
  node: Clinimetrix_Scale_Tags;
};

export type Clinimetrix_Scale_TagsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Clinimetrix_Scale_TagsFilter>>;
  color?: InputMaybe<StringFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  created_by_id?: InputMaybe<UuidFilter>;
  description?: InputMaybe<StringFilter>;
  id?: InputMaybe<BigIntFilter>;
  is_system?: InputMaybe<BooleanFilter>;
  name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Clinimetrix_Scale_TagsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Clinimetrix_Scale_TagsFilter>>;
  slug?: InputMaybe<StringFilter>;
  tag_type?: InputMaybe<StringFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
};

export type Clinimetrix_Scale_TagsInsertInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_by_id?: InputMaybe<Scalars['UUID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  is_system?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  tag_type?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type Clinimetrix_Scale_TagsInsertResponse = {
  __typename?: 'clinimetrix_scale_tagsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinimetrix_Scale_Tags>;
};

export type Clinimetrix_Scale_TagsOrderBy = {
  color?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  created_by_id?: InputMaybe<OrderByDirection>;
  description?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  is_system?: InputMaybe<OrderByDirection>;
  name?: InputMaybe<OrderByDirection>;
  slug?: InputMaybe<OrderByDirection>;
  tag_type?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
};

export type Clinimetrix_Scale_TagsUpdateInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_by_id?: InputMaybe<Scalars['UUID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  is_system?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  tag_type?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type Clinimetrix_Scale_TagsUpdateResponse = {
  __typename?: 'clinimetrix_scale_tagsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinimetrix_Scale_Tags>;
};

export type Clinimetrix_Templates = Node & {
  __typename?: 'clinimetrix_templates';
  abbreviation?: Maybe<Scalars['String']['output']>;
  administration_mode?: Maybe<Scalars['String']['output']>;
  category?: Maybe<Scalars['String']['output']>;
  clinimetrix_assessmentsCollection?: Maybe<Clinimetrix_AssessmentsConnection>;
  clinimetrix_registryCollection?: Maybe<Clinimetrix_RegistryConnection>;
  clinimetrix_remote_assessmentsCollection?: Maybe<Clinimetrix_Remote_AssessmentsConnection>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  estimated_duration_minutes?: Maybe<Scalars['Int']['output']>;
  id: Scalars['String']['output'];
  instructions?: Maybe<Scalars['String']['output']>;
  is_active?: Maybe<Scalars['Boolean']['output']>;
  is_public?: Maybe<Scalars['Boolean']['output']>;
  keywords?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  language?: Maybe<Scalars['String']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  psychometric_properties?: Maybe<Scalars['JSON']['output']>;
  requires_license?: Maybe<Scalars['Boolean']['output']>;
  score_range_max?: Maybe<Scalars['Int']['output']>;
  score_range_min?: Maybe<Scalars['Int']['output']>;
  subcategory?: Maybe<Scalars['String']['output']>;
  tags?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  template_data: Scalars['JSON']['output'];
  total_items?: Maybe<Scalars['Int']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  user_favorite_scalesCollection?: Maybe<User_Favorite_ScalesConnection>;
  version: Scalars['String']['output'];
};


export type Clinimetrix_TemplatesClinimetrix_AssessmentsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Clinimetrix_AssessmentsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Clinimetrix_AssessmentsOrderBy>>;
};


export type Clinimetrix_TemplatesClinimetrix_RegistryCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Clinimetrix_RegistryFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Clinimetrix_RegistryOrderBy>>;
};


export type Clinimetrix_TemplatesClinimetrix_Remote_AssessmentsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Clinimetrix_Remote_AssessmentsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Clinimetrix_Remote_AssessmentsOrderBy>>;
};


export type Clinimetrix_TemplatesUser_Favorite_ScalesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<User_Favorite_ScalesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<User_Favorite_ScalesOrderBy>>;
};

export type Clinimetrix_TemplatesConnection = {
  __typename?: 'clinimetrix_templatesConnection';
  edges: Array<Clinimetrix_TemplatesEdge>;
  pageInfo: PageInfo;
};

export type Clinimetrix_TemplatesDeleteResponse = {
  __typename?: 'clinimetrix_templatesDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinimetrix_Templates>;
};

export type Clinimetrix_TemplatesEdge = {
  __typename?: 'clinimetrix_templatesEdge';
  cursor: Scalars['String']['output'];
  node: Clinimetrix_Templates;
};

export type Clinimetrix_TemplatesFilter = {
  abbreviation?: InputMaybe<StringFilter>;
  administration_mode?: InputMaybe<StringFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Clinimetrix_TemplatesFilter>>;
  category?: InputMaybe<StringFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  description?: InputMaybe<StringFilter>;
  estimated_duration_minutes?: InputMaybe<IntFilter>;
  id?: InputMaybe<StringFilter>;
  instructions?: InputMaybe<StringFilter>;
  is_active?: InputMaybe<BooleanFilter>;
  is_public?: InputMaybe<BooleanFilter>;
  keywords?: InputMaybe<StringListFilter>;
  language?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Clinimetrix_TemplatesFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Clinimetrix_TemplatesFilter>>;
  requires_license?: InputMaybe<BooleanFilter>;
  score_range_max?: InputMaybe<IntFilter>;
  score_range_min?: InputMaybe<IntFilter>;
  subcategory?: InputMaybe<StringFilter>;
  tags?: InputMaybe<StringListFilter>;
  total_items?: InputMaybe<IntFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  version?: InputMaybe<StringFilter>;
};

export type Clinimetrix_TemplatesInsertInput = {
  abbreviation?: InputMaybe<Scalars['String']['input']>;
  administration_mode?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  estimated_duration_minutes?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  instructions?: InputMaybe<Scalars['String']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  is_public?: InputMaybe<Scalars['Boolean']['input']>;
  keywords?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  language?: InputMaybe<Scalars['String']['input']>;
  psychometric_properties?: InputMaybe<Scalars['JSON']['input']>;
  requires_license?: InputMaybe<Scalars['Boolean']['input']>;
  score_range_max?: InputMaybe<Scalars['Int']['input']>;
  score_range_min?: InputMaybe<Scalars['Int']['input']>;
  subcategory?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  template_data?: InputMaybe<Scalars['JSON']['input']>;
  total_items?: InputMaybe<Scalars['Int']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};

export type Clinimetrix_TemplatesInsertResponse = {
  __typename?: 'clinimetrix_templatesInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinimetrix_Templates>;
};

export type Clinimetrix_TemplatesOrderBy = {
  abbreviation?: InputMaybe<OrderByDirection>;
  administration_mode?: InputMaybe<OrderByDirection>;
  category?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  description?: InputMaybe<OrderByDirection>;
  estimated_duration_minutes?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  instructions?: InputMaybe<OrderByDirection>;
  is_active?: InputMaybe<OrderByDirection>;
  is_public?: InputMaybe<OrderByDirection>;
  language?: InputMaybe<OrderByDirection>;
  requires_license?: InputMaybe<OrderByDirection>;
  score_range_max?: InputMaybe<OrderByDirection>;
  score_range_min?: InputMaybe<OrderByDirection>;
  subcategory?: InputMaybe<OrderByDirection>;
  total_items?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  version?: InputMaybe<OrderByDirection>;
};

export type Clinimetrix_TemplatesUpdateInput = {
  abbreviation?: InputMaybe<Scalars['String']['input']>;
  administration_mode?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  estimated_duration_minutes?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  instructions?: InputMaybe<Scalars['String']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  is_public?: InputMaybe<Scalars['Boolean']['input']>;
  keywords?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  language?: InputMaybe<Scalars['String']['input']>;
  psychometric_properties?: InputMaybe<Scalars['JSON']['input']>;
  requires_license?: InputMaybe<Scalars['Boolean']['input']>;
  score_range_max?: InputMaybe<Scalars['Int']['input']>;
  score_range_min?: InputMaybe<Scalars['Int']['input']>;
  subcategory?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  template_data?: InputMaybe<Scalars['JSON']['input']>;
  total_items?: InputMaybe<Scalars['Int']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};

export type Clinimetrix_TemplatesUpdateResponse = {
  __typename?: 'clinimetrix_templatesUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Clinimetrix_Templates>;
};

export type Consultation_Templates = Node & {
  __typename?: 'consultation_templates';
  clinic_id?: Maybe<Scalars['UUID']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  created_by: Scalars['UUID']['output'];
  description?: Maybe<Scalars['String']['output']>;
  fields_config?: Maybe<Scalars['JSON']['output']>;
  formx_template_id?: Maybe<Scalars['UUID']['output']>;
  id: Scalars['UUID']['output'];
  is_active?: Maybe<Scalars['Boolean']['output']>;
  is_default?: Maybe<Scalars['Boolean']['output']>;
  name: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  template_type?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  workspace_id?: Maybe<Scalars['UUID']['output']>;
};

export type Consultation_TemplatesConnection = {
  __typename?: 'consultation_templatesConnection';
  edges: Array<Consultation_TemplatesEdge>;
  pageInfo: PageInfo;
};

export type Consultation_TemplatesDeleteResponse = {
  __typename?: 'consultation_templatesDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Consultation_Templates>;
};

export type Consultation_TemplatesEdge = {
  __typename?: 'consultation_templatesEdge';
  cursor: Scalars['String']['output'];
  node: Consultation_Templates;
};

export type Consultation_TemplatesFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Consultation_TemplatesFilter>>;
  clinic_id?: InputMaybe<UuidFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  created_by?: InputMaybe<UuidFilter>;
  description?: InputMaybe<StringFilter>;
  formx_template_id?: InputMaybe<UuidFilter>;
  id?: InputMaybe<UuidFilter>;
  is_active?: InputMaybe<BooleanFilter>;
  is_default?: InputMaybe<BooleanFilter>;
  name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Consultation_TemplatesFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Consultation_TemplatesFilter>>;
  template_type?: InputMaybe<StringFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  workspace_id?: InputMaybe<UuidFilter>;
};

export type Consultation_TemplatesInsertInput = {
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_by?: InputMaybe<Scalars['UUID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  fields_config?: InputMaybe<Scalars['JSON']['input']>;
  formx_template_id?: InputMaybe<Scalars['UUID']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  is_default?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  template_type?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Consultation_TemplatesInsertResponse = {
  __typename?: 'consultation_templatesInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Consultation_Templates>;
};

export type Consultation_TemplatesOrderBy = {
  clinic_id?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  created_by?: InputMaybe<OrderByDirection>;
  description?: InputMaybe<OrderByDirection>;
  formx_template_id?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  is_active?: InputMaybe<OrderByDirection>;
  is_default?: InputMaybe<OrderByDirection>;
  name?: InputMaybe<OrderByDirection>;
  template_type?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  workspace_id?: InputMaybe<OrderByDirection>;
};

export type Consultation_TemplatesUpdateInput = {
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_by?: InputMaybe<Scalars['UUID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  fields_config?: InputMaybe<Scalars['JSON']['input']>;
  formx_template_id?: InputMaybe<Scalars['UUID']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  is_default?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  template_type?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Consultation_TemplatesUpdateResponse = {
  __typename?: 'consultation_templatesUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Consultation_Templates>;
};

export type Consultations = Node & {
  __typename?: 'consultations';
  assessment?: Maybe<Scalars['String']['output']>;
  assessmentsCollection?: Maybe<AssessmentsConnection>;
  chief_complaint?: Maybe<Scalars['String']['output']>;
  clinic_configurations?: Maybe<Clinic_Configurations>;
  clinic_id: Scalars['UUID']['output'];
  clinical_notes?: Maybe<Scalars['String']['output']>;
  clinimetrix_assessmentsCollection?: Maybe<Clinimetrix_AssessmentsConnection>;
  consultation_date?: Maybe<Scalars['Datetime']['output']>;
  consultation_metadata?: Maybe<Scalars['JSON']['output']>;
  consultation_type?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  diagnosis?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  diagnosis_codes?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  duration_minutes?: Maybe<Scalars['Int']['output']>;
  edit_reason?: Maybe<Scalars['String']['output']>;
  edited_by?: Maybe<Scalars['UUID']['output']>;
  finalized_at?: Maybe<Scalars['Datetime']['output']>;
  finalized_by?: Maybe<Scalars['UUID']['output']>;
  finance_incomeCollection?: Maybe<Finance_IncomeConnection>;
  follow_up_date?: Maybe<Scalars['Date']['output']>;
  follow_up_instructions?: Maybe<Scalars['String']['output']>;
  form_customizations?: Maybe<Scalars['JSON']['output']>;
  history_present_illness?: Maybe<Scalars['String']['output']>;
  id: Scalars['UUID']['output'];
  individual_workspaces?: Maybe<Individual_Workspaces>;
  is_billable?: Maybe<Scalars['Boolean']['output']>;
  is_draft?: Maybe<Scalars['Boolean']['output']>;
  is_finalized?: Maybe<Scalars['Boolean']['output']>;
  linked_appointment_id?: Maybe<Scalars['UUID']['output']>;
  linked_assessments?: Maybe<Scalars['JSON']['output']>;
  mental_exam?: Maybe<Scalars['JSON']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  patient_id?: Maybe<Scalars['UUID']['output']>;
  patients?: Maybe<Patients>;
  physical_examination?: Maybe<Scalars['String']['output']>;
  plan?: Maybe<Scalars['String']['output']>;
  prescriptions?: Maybe<Scalars['JSON']['output']>;
  prescriptionsCollection?: Maybe<PrescriptionsConnection>;
  present_illness?: Maybe<Scalars['String']['output']>;
  private_notes?: Maybe<Scalars['String']['output']>;
  professional_id?: Maybe<Scalars['UUID']['output']>;
  quality_notes?: Maybe<Scalars['String']['output']>;
  quality_review_date?: Maybe<Scalars['Datetime']['output']>;
  quality_reviewed?: Maybe<Scalars['Boolean']['output']>;
  quality_reviewer_id?: Maybe<Scalars['UUID']['output']>;
  review_of_systems?: Maybe<Scalars['String']['output']>;
  revision_number?: Maybe<Scalars['Int']['output']>;
  sections_completed?: Maybe<Scalars['JSON']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  template_config?: Maybe<Scalars['JSON']['output']>;
  treatment_plan?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  vital_signs?: Maybe<Scalars['JSON']['output']>;
  workspace_id?: Maybe<Scalars['UUID']['output']>;
};


export type ConsultationsAssessmentsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<AssessmentsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<AssessmentsOrderBy>>;
};


export type ConsultationsClinimetrix_AssessmentsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Clinimetrix_AssessmentsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Clinimetrix_AssessmentsOrderBy>>;
};


export type ConsultationsFinance_IncomeCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Finance_IncomeFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Finance_IncomeOrderBy>>;
};


export type ConsultationsPrescriptionsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<PrescriptionsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<PrescriptionsOrderBy>>;
};

export type ConsultationsConnection = {
  __typename?: 'consultationsConnection';
  edges: Array<ConsultationsEdge>;
  pageInfo: PageInfo;
};

export type ConsultationsDeleteResponse = {
  __typename?: 'consultationsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Consultations>;
};

export type ConsultationsEdge = {
  __typename?: 'consultationsEdge';
  cursor: Scalars['String']['output'];
  node: Consultations;
};

export type ConsultationsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<ConsultationsFilter>>;
  assessment?: InputMaybe<StringFilter>;
  chief_complaint?: InputMaybe<StringFilter>;
  clinic_id?: InputMaybe<UuidFilter>;
  clinical_notes?: InputMaybe<StringFilter>;
  consultation_date?: InputMaybe<DatetimeFilter>;
  consultation_type?: InputMaybe<StringFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  diagnosis?: InputMaybe<StringListFilter>;
  diagnosis_codes?: InputMaybe<StringListFilter>;
  duration_minutes?: InputMaybe<IntFilter>;
  edit_reason?: InputMaybe<StringFilter>;
  edited_by?: InputMaybe<UuidFilter>;
  finalized_at?: InputMaybe<DatetimeFilter>;
  finalized_by?: InputMaybe<UuidFilter>;
  follow_up_date?: InputMaybe<DateFilter>;
  follow_up_instructions?: InputMaybe<StringFilter>;
  history_present_illness?: InputMaybe<StringFilter>;
  id?: InputMaybe<UuidFilter>;
  is_billable?: InputMaybe<BooleanFilter>;
  is_draft?: InputMaybe<BooleanFilter>;
  is_finalized?: InputMaybe<BooleanFilter>;
  linked_appointment_id?: InputMaybe<UuidFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<ConsultationsFilter>;
  notes?: InputMaybe<StringFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<ConsultationsFilter>>;
  patient_id?: InputMaybe<UuidFilter>;
  physical_examination?: InputMaybe<StringFilter>;
  plan?: InputMaybe<StringFilter>;
  present_illness?: InputMaybe<StringFilter>;
  private_notes?: InputMaybe<StringFilter>;
  professional_id?: InputMaybe<UuidFilter>;
  quality_notes?: InputMaybe<StringFilter>;
  quality_review_date?: InputMaybe<DatetimeFilter>;
  quality_reviewed?: InputMaybe<BooleanFilter>;
  quality_reviewer_id?: InputMaybe<UuidFilter>;
  review_of_systems?: InputMaybe<StringFilter>;
  revision_number?: InputMaybe<IntFilter>;
  status?: InputMaybe<StringFilter>;
  treatment_plan?: InputMaybe<StringFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  workspace_id?: InputMaybe<UuidFilter>;
};

export type ConsultationsInsertInput = {
  assessment?: InputMaybe<Scalars['String']['input']>;
  chief_complaint?: InputMaybe<Scalars['String']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  clinical_notes?: InputMaybe<Scalars['String']['input']>;
  consultation_date?: InputMaybe<Scalars['Datetime']['input']>;
  consultation_metadata?: InputMaybe<Scalars['JSON']['input']>;
  consultation_type?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  diagnosis?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  diagnosis_codes?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  duration_minutes?: InputMaybe<Scalars['Int']['input']>;
  edit_reason?: InputMaybe<Scalars['String']['input']>;
  edited_by?: InputMaybe<Scalars['UUID']['input']>;
  finalized_at?: InputMaybe<Scalars['Datetime']['input']>;
  finalized_by?: InputMaybe<Scalars['UUID']['input']>;
  follow_up_date?: InputMaybe<Scalars['Date']['input']>;
  follow_up_instructions?: InputMaybe<Scalars['String']['input']>;
  form_customizations?: InputMaybe<Scalars['JSON']['input']>;
  history_present_illness?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_billable?: InputMaybe<Scalars['Boolean']['input']>;
  is_draft?: InputMaybe<Scalars['Boolean']['input']>;
  is_finalized?: InputMaybe<Scalars['Boolean']['input']>;
  linked_appointment_id?: InputMaybe<Scalars['UUID']['input']>;
  linked_assessments?: InputMaybe<Scalars['JSON']['input']>;
  mental_exam?: InputMaybe<Scalars['JSON']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  physical_examination?: InputMaybe<Scalars['String']['input']>;
  plan?: InputMaybe<Scalars['String']['input']>;
  prescriptions?: InputMaybe<Scalars['JSON']['input']>;
  present_illness?: InputMaybe<Scalars['String']['input']>;
  private_notes?: InputMaybe<Scalars['String']['input']>;
  professional_id?: InputMaybe<Scalars['UUID']['input']>;
  quality_notes?: InputMaybe<Scalars['String']['input']>;
  quality_review_date?: InputMaybe<Scalars['Datetime']['input']>;
  quality_reviewed?: InputMaybe<Scalars['Boolean']['input']>;
  quality_reviewer_id?: InputMaybe<Scalars['UUID']['input']>;
  review_of_systems?: InputMaybe<Scalars['String']['input']>;
  revision_number?: InputMaybe<Scalars['Int']['input']>;
  sections_completed?: InputMaybe<Scalars['JSON']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  template_config?: InputMaybe<Scalars['JSON']['input']>;
  treatment_plan?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  vital_signs?: InputMaybe<Scalars['JSON']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type ConsultationsInsertResponse = {
  __typename?: 'consultationsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Consultations>;
};

export type ConsultationsOrderBy = {
  assessment?: InputMaybe<OrderByDirection>;
  chief_complaint?: InputMaybe<OrderByDirection>;
  clinic_id?: InputMaybe<OrderByDirection>;
  clinical_notes?: InputMaybe<OrderByDirection>;
  consultation_date?: InputMaybe<OrderByDirection>;
  consultation_type?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  duration_minutes?: InputMaybe<OrderByDirection>;
  edit_reason?: InputMaybe<OrderByDirection>;
  edited_by?: InputMaybe<OrderByDirection>;
  finalized_at?: InputMaybe<OrderByDirection>;
  finalized_by?: InputMaybe<OrderByDirection>;
  follow_up_date?: InputMaybe<OrderByDirection>;
  follow_up_instructions?: InputMaybe<OrderByDirection>;
  history_present_illness?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  is_billable?: InputMaybe<OrderByDirection>;
  is_draft?: InputMaybe<OrderByDirection>;
  is_finalized?: InputMaybe<OrderByDirection>;
  linked_appointment_id?: InputMaybe<OrderByDirection>;
  notes?: InputMaybe<OrderByDirection>;
  patient_id?: InputMaybe<OrderByDirection>;
  physical_examination?: InputMaybe<OrderByDirection>;
  plan?: InputMaybe<OrderByDirection>;
  present_illness?: InputMaybe<OrderByDirection>;
  private_notes?: InputMaybe<OrderByDirection>;
  professional_id?: InputMaybe<OrderByDirection>;
  quality_notes?: InputMaybe<OrderByDirection>;
  quality_review_date?: InputMaybe<OrderByDirection>;
  quality_reviewed?: InputMaybe<OrderByDirection>;
  quality_reviewer_id?: InputMaybe<OrderByDirection>;
  review_of_systems?: InputMaybe<OrderByDirection>;
  revision_number?: InputMaybe<OrderByDirection>;
  status?: InputMaybe<OrderByDirection>;
  treatment_plan?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  workspace_id?: InputMaybe<OrderByDirection>;
};

export type ConsultationsUpdateInput = {
  assessment?: InputMaybe<Scalars['String']['input']>;
  chief_complaint?: InputMaybe<Scalars['String']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  clinical_notes?: InputMaybe<Scalars['String']['input']>;
  consultation_date?: InputMaybe<Scalars['Datetime']['input']>;
  consultation_metadata?: InputMaybe<Scalars['JSON']['input']>;
  consultation_type?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  diagnosis?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  diagnosis_codes?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  duration_minutes?: InputMaybe<Scalars['Int']['input']>;
  edit_reason?: InputMaybe<Scalars['String']['input']>;
  edited_by?: InputMaybe<Scalars['UUID']['input']>;
  finalized_at?: InputMaybe<Scalars['Datetime']['input']>;
  finalized_by?: InputMaybe<Scalars['UUID']['input']>;
  follow_up_date?: InputMaybe<Scalars['Date']['input']>;
  follow_up_instructions?: InputMaybe<Scalars['String']['input']>;
  form_customizations?: InputMaybe<Scalars['JSON']['input']>;
  history_present_illness?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_billable?: InputMaybe<Scalars['Boolean']['input']>;
  is_draft?: InputMaybe<Scalars['Boolean']['input']>;
  is_finalized?: InputMaybe<Scalars['Boolean']['input']>;
  linked_appointment_id?: InputMaybe<Scalars['UUID']['input']>;
  linked_assessments?: InputMaybe<Scalars['JSON']['input']>;
  mental_exam?: InputMaybe<Scalars['JSON']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  physical_examination?: InputMaybe<Scalars['String']['input']>;
  plan?: InputMaybe<Scalars['String']['input']>;
  prescriptions?: InputMaybe<Scalars['JSON']['input']>;
  present_illness?: InputMaybe<Scalars['String']['input']>;
  private_notes?: InputMaybe<Scalars['String']['input']>;
  professional_id?: InputMaybe<Scalars['UUID']['input']>;
  quality_notes?: InputMaybe<Scalars['String']['input']>;
  quality_review_date?: InputMaybe<Scalars['Datetime']['input']>;
  quality_reviewed?: InputMaybe<Scalars['Boolean']['input']>;
  quality_reviewer_id?: InputMaybe<Scalars['UUID']['input']>;
  review_of_systems?: InputMaybe<Scalars['String']['input']>;
  revision_number?: InputMaybe<Scalars['Int']['input']>;
  sections_completed?: InputMaybe<Scalars['JSON']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  template_config?: InputMaybe<Scalars['JSON']['input']>;
  treatment_plan?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  vital_signs?: InputMaybe<Scalars['JSON']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type ConsultationsUpdateResponse = {
  __typename?: 'consultationsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Consultations>;
};

export type Django_Admin_Log = Node & {
  __typename?: 'django_admin_log';
  action_flag: Scalars['Int']['output'];
  action_time: Scalars['Datetime']['output'];
  change_message: Scalars['String']['output'];
  content_type_id?: Maybe<Scalars['Int']['output']>;
  django_content_type?: Maybe<Django_Content_Type>;
  id: Scalars['Int']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  object_id?: Maybe<Scalars['String']['output']>;
  object_repr: Scalars['String']['output'];
  user_id: Scalars['BigInt']['output'];
};

export type Django_Admin_LogConnection = {
  __typename?: 'django_admin_logConnection';
  edges: Array<Django_Admin_LogEdge>;
  pageInfo: PageInfo;
};

export type Django_Admin_LogDeleteResponse = {
  __typename?: 'django_admin_logDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Django_Admin_Log>;
};

export type Django_Admin_LogEdge = {
  __typename?: 'django_admin_logEdge';
  cursor: Scalars['String']['output'];
  node: Django_Admin_Log;
};

export type Django_Admin_LogFilter = {
  action_flag?: InputMaybe<IntFilter>;
  action_time?: InputMaybe<DatetimeFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Django_Admin_LogFilter>>;
  change_message?: InputMaybe<StringFilter>;
  content_type_id?: InputMaybe<IntFilter>;
  id?: InputMaybe<IntFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Django_Admin_LogFilter>;
  object_id?: InputMaybe<StringFilter>;
  object_repr?: InputMaybe<StringFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Django_Admin_LogFilter>>;
  user_id?: InputMaybe<BigIntFilter>;
};

export type Django_Admin_LogInsertInput = {
  action_flag?: InputMaybe<Scalars['Int']['input']>;
  action_time?: InputMaybe<Scalars['Datetime']['input']>;
  change_message?: InputMaybe<Scalars['String']['input']>;
  content_type_id?: InputMaybe<Scalars['Int']['input']>;
  object_id?: InputMaybe<Scalars['String']['input']>;
  object_repr?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['BigInt']['input']>;
};

export type Django_Admin_LogInsertResponse = {
  __typename?: 'django_admin_logInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Django_Admin_Log>;
};

export type Django_Admin_LogOrderBy = {
  action_flag?: InputMaybe<OrderByDirection>;
  action_time?: InputMaybe<OrderByDirection>;
  change_message?: InputMaybe<OrderByDirection>;
  content_type_id?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  object_id?: InputMaybe<OrderByDirection>;
  object_repr?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type Django_Admin_LogUpdateInput = {
  action_flag?: InputMaybe<Scalars['Int']['input']>;
  action_time?: InputMaybe<Scalars['Datetime']['input']>;
  change_message?: InputMaybe<Scalars['String']['input']>;
  content_type_id?: InputMaybe<Scalars['Int']['input']>;
  object_id?: InputMaybe<Scalars['String']['input']>;
  object_repr?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['BigInt']['input']>;
};

export type Django_Admin_LogUpdateResponse = {
  __typename?: 'django_admin_logUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Django_Admin_Log>;
};

export type Django_Content_Type = Node & {
  __typename?: 'django_content_type';
  app_label: Scalars['String']['output'];
  auth_permissionCollection?: Maybe<Auth_PermissionConnection>;
  django_admin_logCollection?: Maybe<Django_Admin_LogConnection>;
  id: Scalars['Int']['output'];
  model: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
};


export type Django_Content_TypeAuth_PermissionCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Auth_PermissionFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Auth_PermissionOrderBy>>;
};


export type Django_Content_TypeDjango_Admin_LogCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Django_Admin_LogFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Django_Admin_LogOrderBy>>;
};

export type Django_Content_TypeConnection = {
  __typename?: 'django_content_typeConnection';
  edges: Array<Django_Content_TypeEdge>;
  pageInfo: PageInfo;
};

export type Django_Content_TypeDeleteResponse = {
  __typename?: 'django_content_typeDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Django_Content_Type>;
};

export type Django_Content_TypeEdge = {
  __typename?: 'django_content_typeEdge';
  cursor: Scalars['String']['output'];
  node: Django_Content_Type;
};

export type Django_Content_TypeFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Django_Content_TypeFilter>>;
  app_label?: InputMaybe<StringFilter>;
  id?: InputMaybe<IntFilter>;
  model?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Django_Content_TypeFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Django_Content_TypeFilter>>;
};

export type Django_Content_TypeInsertInput = {
  app_label?: InputMaybe<Scalars['String']['input']>;
  model?: InputMaybe<Scalars['String']['input']>;
};

export type Django_Content_TypeInsertResponse = {
  __typename?: 'django_content_typeInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Django_Content_Type>;
};

export type Django_Content_TypeOrderBy = {
  app_label?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  model?: InputMaybe<OrderByDirection>;
};

export type Django_Content_TypeUpdateInput = {
  app_label?: InputMaybe<Scalars['String']['input']>;
  model?: InputMaybe<Scalars['String']['input']>;
};

export type Django_Content_TypeUpdateResponse = {
  __typename?: 'django_content_typeUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Django_Content_Type>;
};

export type Django_Migrations = Node & {
  __typename?: 'django_migrations';
  app: Scalars['String']['output'];
  applied: Scalars['Datetime']['output'];
  id: Scalars['BigInt']['output'];
  name: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
};

export type Django_MigrationsConnection = {
  __typename?: 'django_migrationsConnection';
  edges: Array<Django_MigrationsEdge>;
  pageInfo: PageInfo;
};

export type Django_MigrationsDeleteResponse = {
  __typename?: 'django_migrationsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Django_Migrations>;
};

export type Django_MigrationsEdge = {
  __typename?: 'django_migrationsEdge';
  cursor: Scalars['String']['output'];
  node: Django_Migrations;
};

export type Django_MigrationsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Django_MigrationsFilter>>;
  app?: InputMaybe<StringFilter>;
  applied?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<BigIntFilter>;
  name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Django_MigrationsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Django_MigrationsFilter>>;
};

export type Django_MigrationsInsertInput = {
  app?: InputMaybe<Scalars['String']['input']>;
  applied?: InputMaybe<Scalars['Datetime']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type Django_MigrationsInsertResponse = {
  __typename?: 'django_migrationsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Django_Migrations>;
};

export type Django_MigrationsOrderBy = {
  app?: InputMaybe<OrderByDirection>;
  applied?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  name?: InputMaybe<OrderByDirection>;
};

export type Django_MigrationsUpdateInput = {
  app?: InputMaybe<Scalars['String']['input']>;
  applied?: InputMaybe<Scalars['Datetime']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type Django_MigrationsUpdateResponse = {
  __typename?: 'django_migrationsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Django_Migrations>;
};

export type Dynamic_Forms = Node & {
  __typename?: 'dynamic_forms';
  category?: Maybe<Scalars['String']['output']>;
  clinic_configurations?: Maybe<Clinic_Configurations>;
  clinic_id: Scalars['UUID']['output'];
  created_at?: Maybe<Scalars['Datetime']['output']>;
  created_by: Scalars['UUID']['output'];
  form_description?: Maybe<Scalars['String']['output']>;
  form_name: Scalars['String']['output'];
  form_schema: Scalars['JSON']['output'];
  form_settings?: Maybe<Scalars['JSON']['output']>;
  form_submissionsCollection?: Maybe<Form_SubmissionsConnection>;
  id: Scalars['UUID']['output'];
  individual_workspaces?: Maybe<Individual_Workspaces>;
  is_active?: Maybe<Scalars['Boolean']['output']>;
  is_template?: Maybe<Scalars['Boolean']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  profiles?: Maybe<Profiles>;
  requires_patient?: Maybe<Scalars['Boolean']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  usage_count?: Maybe<Scalars['Int']['output']>;
  workspace_id?: Maybe<Scalars['UUID']['output']>;
};


export type Dynamic_FormsForm_SubmissionsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Form_SubmissionsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Form_SubmissionsOrderBy>>;
};

export type Dynamic_FormsConnection = {
  __typename?: 'dynamic_formsConnection';
  edges: Array<Dynamic_FormsEdge>;
  pageInfo: PageInfo;
};

export type Dynamic_FormsDeleteResponse = {
  __typename?: 'dynamic_formsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Dynamic_Forms>;
};

export type Dynamic_FormsEdge = {
  __typename?: 'dynamic_formsEdge';
  cursor: Scalars['String']['output'];
  node: Dynamic_Forms;
};

export type Dynamic_FormsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Dynamic_FormsFilter>>;
  category?: InputMaybe<StringFilter>;
  clinic_id?: InputMaybe<UuidFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  created_by?: InputMaybe<UuidFilter>;
  form_description?: InputMaybe<StringFilter>;
  form_name?: InputMaybe<StringFilter>;
  id?: InputMaybe<UuidFilter>;
  is_active?: InputMaybe<BooleanFilter>;
  is_template?: InputMaybe<BooleanFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Dynamic_FormsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Dynamic_FormsFilter>>;
  requires_patient?: InputMaybe<BooleanFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  usage_count?: InputMaybe<IntFilter>;
  workspace_id?: InputMaybe<UuidFilter>;
};

export type Dynamic_FormsInsertInput = {
  category?: InputMaybe<Scalars['String']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_by?: InputMaybe<Scalars['UUID']['input']>;
  form_description?: InputMaybe<Scalars['String']['input']>;
  form_name?: InputMaybe<Scalars['String']['input']>;
  form_schema?: InputMaybe<Scalars['JSON']['input']>;
  form_settings?: InputMaybe<Scalars['JSON']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  is_template?: InputMaybe<Scalars['Boolean']['input']>;
  requires_patient?: InputMaybe<Scalars['Boolean']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  usage_count?: InputMaybe<Scalars['Int']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Dynamic_FormsInsertResponse = {
  __typename?: 'dynamic_formsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Dynamic_Forms>;
};

export type Dynamic_FormsOrderBy = {
  category?: InputMaybe<OrderByDirection>;
  clinic_id?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  created_by?: InputMaybe<OrderByDirection>;
  form_description?: InputMaybe<OrderByDirection>;
  form_name?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  is_active?: InputMaybe<OrderByDirection>;
  is_template?: InputMaybe<OrderByDirection>;
  requires_patient?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  usage_count?: InputMaybe<OrderByDirection>;
  workspace_id?: InputMaybe<OrderByDirection>;
};

export type Dynamic_FormsUpdateInput = {
  category?: InputMaybe<Scalars['String']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_by?: InputMaybe<Scalars['UUID']['input']>;
  form_description?: InputMaybe<Scalars['String']['input']>;
  form_name?: InputMaybe<Scalars['String']['input']>;
  form_schema?: InputMaybe<Scalars['JSON']['input']>;
  form_settings?: InputMaybe<Scalars['JSON']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  is_template?: InputMaybe<Scalars['Boolean']['input']>;
  requires_patient?: InputMaybe<Scalars['Boolean']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  usage_count?: InputMaybe<Scalars['Int']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Dynamic_FormsUpdateResponse = {
  __typename?: 'dynamic_formsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Dynamic_Forms>;
};

export type Finance_Cash_Register_Cuts = Node & {
  __typename?: 'finance_cash_register_cuts';
  actual_cash: Scalars['BigFloat']['output'];
  clinic_id: Scalars['UUID']['output'];
  clinics?: Maybe<Clinics>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  cut_date: Scalars['Date']['output'];
  cut_number: Scalars['String']['output'];
  difference?: Maybe<Scalars['BigFloat']['output']>;
  expected_cash: Scalars['BigFloat']['output'];
  id: Scalars['UUID']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  profiles?: Maybe<Profiles>;
  responsible_professional_id?: Maybe<Scalars['UUID']['output']>;
  responsible_professional_name?: Maybe<Scalars['String']['output']>;
  total_card_income?: Maybe<Scalars['BigFloat']['output']>;
  total_cash_income?: Maybe<Scalars['BigFloat']['output']>;
  total_other_income?: Maybe<Scalars['BigFloat']['output']>;
  total_transfer_income?: Maybe<Scalars['BigFloat']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
};

export type Finance_Cash_Register_CutsConnection = {
  __typename?: 'finance_cash_register_cutsConnection';
  edges: Array<Finance_Cash_Register_CutsEdge>;
  pageInfo: PageInfo;
};

export type Finance_Cash_Register_CutsDeleteResponse = {
  __typename?: 'finance_cash_register_cutsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Finance_Cash_Register_Cuts>;
};

export type Finance_Cash_Register_CutsEdge = {
  __typename?: 'finance_cash_register_cutsEdge';
  cursor: Scalars['String']['output'];
  node: Finance_Cash_Register_Cuts;
};

export type Finance_Cash_Register_CutsFilter = {
  actual_cash?: InputMaybe<BigFloatFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Finance_Cash_Register_CutsFilter>>;
  clinic_id?: InputMaybe<UuidFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  cut_date?: InputMaybe<DateFilter>;
  cut_number?: InputMaybe<StringFilter>;
  difference?: InputMaybe<BigFloatFilter>;
  expected_cash?: InputMaybe<BigFloatFilter>;
  id?: InputMaybe<UuidFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Finance_Cash_Register_CutsFilter>;
  notes?: InputMaybe<StringFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Finance_Cash_Register_CutsFilter>>;
  responsible_professional_id?: InputMaybe<UuidFilter>;
  responsible_professional_name?: InputMaybe<StringFilter>;
  total_card_income?: InputMaybe<BigFloatFilter>;
  total_cash_income?: InputMaybe<BigFloatFilter>;
  total_other_income?: InputMaybe<BigFloatFilter>;
  total_transfer_income?: InputMaybe<BigFloatFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
};

export type Finance_Cash_Register_CutsInsertInput = {
  actual_cash?: InputMaybe<Scalars['BigFloat']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  cut_date?: InputMaybe<Scalars['Date']['input']>;
  cut_number?: InputMaybe<Scalars['String']['input']>;
  expected_cash?: InputMaybe<Scalars['BigFloat']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  responsible_professional_id?: InputMaybe<Scalars['UUID']['input']>;
  responsible_professional_name?: InputMaybe<Scalars['String']['input']>;
  total_card_income?: InputMaybe<Scalars['BigFloat']['input']>;
  total_cash_income?: InputMaybe<Scalars['BigFloat']['input']>;
  total_other_income?: InputMaybe<Scalars['BigFloat']['input']>;
  total_transfer_income?: InputMaybe<Scalars['BigFloat']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type Finance_Cash_Register_CutsInsertResponse = {
  __typename?: 'finance_cash_register_cutsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Finance_Cash_Register_Cuts>;
};

export type Finance_Cash_Register_CutsOrderBy = {
  actual_cash?: InputMaybe<OrderByDirection>;
  clinic_id?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  cut_date?: InputMaybe<OrderByDirection>;
  cut_number?: InputMaybe<OrderByDirection>;
  difference?: InputMaybe<OrderByDirection>;
  expected_cash?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  notes?: InputMaybe<OrderByDirection>;
  responsible_professional_id?: InputMaybe<OrderByDirection>;
  responsible_professional_name?: InputMaybe<OrderByDirection>;
  total_card_income?: InputMaybe<OrderByDirection>;
  total_cash_income?: InputMaybe<OrderByDirection>;
  total_other_income?: InputMaybe<OrderByDirection>;
  total_transfer_income?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
};

export type Finance_Cash_Register_CutsUpdateInput = {
  actual_cash?: InputMaybe<Scalars['BigFloat']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  cut_date?: InputMaybe<Scalars['Date']['input']>;
  cut_number?: InputMaybe<Scalars['String']['input']>;
  expected_cash?: InputMaybe<Scalars['BigFloat']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  responsible_professional_id?: InputMaybe<Scalars['UUID']['input']>;
  responsible_professional_name?: InputMaybe<Scalars['String']['input']>;
  total_card_income?: InputMaybe<Scalars['BigFloat']['input']>;
  total_cash_income?: InputMaybe<Scalars['BigFloat']['input']>;
  total_other_income?: InputMaybe<Scalars['BigFloat']['input']>;
  total_transfer_income?: InputMaybe<Scalars['BigFloat']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type Finance_Cash_Register_CutsUpdateResponse = {
  __typename?: 'finance_cash_register_cutsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Finance_Cash_Register_Cuts>;
};

export type Finance_Income = Node & {
  __typename?: 'finance_income';
  amount: Scalars['BigFloat']['output'];
  clinic_id?: Maybe<Scalars['UUID']['output']>;
  clinics?: Maybe<Clinics>;
  concept?: Maybe<Scalars['String']['output']>;
  consultation_id?: Maybe<Scalars['UUID']['output']>;
  consultations?: Maybe<Consultations>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  currency?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['UUID']['output'];
  individual_workspaces?: Maybe<Individual_Workspaces>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  patient_id?: Maybe<Scalars['UUID']['output']>;
  patient_name?: Maybe<Scalars['String']['output']>;
  patients?: Maybe<Patients>;
  payment_method?: Maybe<Scalars['String']['output']>;
  professional_id?: Maybe<Scalars['UUID']['output']>;
  professional_name?: Maybe<Scalars['String']['output']>;
  profiles?: Maybe<Profiles>;
  received_date?: Maybe<Scalars['Date']['output']>;
  reference?: Maybe<Scalars['String']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  workspace_id?: Maybe<Scalars['UUID']['output']>;
};

export type Finance_IncomeConnection = {
  __typename?: 'finance_incomeConnection';
  edges: Array<Finance_IncomeEdge>;
  pageInfo: PageInfo;
};

export type Finance_IncomeDeleteResponse = {
  __typename?: 'finance_incomeDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Finance_Income>;
};

export type Finance_IncomeEdge = {
  __typename?: 'finance_incomeEdge';
  cursor: Scalars['String']['output'];
  node: Finance_Income;
};

export type Finance_IncomeFilter = {
  amount?: InputMaybe<BigFloatFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Finance_IncomeFilter>>;
  clinic_id?: InputMaybe<UuidFilter>;
  concept?: InputMaybe<StringFilter>;
  consultation_id?: InputMaybe<UuidFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  currency?: InputMaybe<StringFilter>;
  description?: InputMaybe<StringFilter>;
  id?: InputMaybe<UuidFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Finance_IncomeFilter>;
  notes?: InputMaybe<StringFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Finance_IncomeFilter>>;
  patient_id?: InputMaybe<UuidFilter>;
  patient_name?: InputMaybe<StringFilter>;
  payment_method?: InputMaybe<StringFilter>;
  professional_id?: InputMaybe<UuidFilter>;
  professional_name?: InputMaybe<StringFilter>;
  received_date?: InputMaybe<DateFilter>;
  reference?: InputMaybe<StringFilter>;
  source?: InputMaybe<StringFilter>;
  status?: InputMaybe<StringFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  workspace_id?: InputMaybe<UuidFilter>;
};

export type Finance_IncomeInsertInput = {
  amount?: InputMaybe<Scalars['BigFloat']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  concept?: InputMaybe<Scalars['String']['input']>;
  consultation_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  currency?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  patient_name?: InputMaybe<Scalars['String']['input']>;
  payment_method?: InputMaybe<Scalars['String']['input']>;
  professional_id?: InputMaybe<Scalars['UUID']['input']>;
  professional_name?: InputMaybe<Scalars['String']['input']>;
  received_date?: InputMaybe<Scalars['Date']['input']>;
  reference?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Finance_IncomeInsertResponse = {
  __typename?: 'finance_incomeInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Finance_Income>;
};

export type Finance_IncomeOrderBy = {
  amount?: InputMaybe<OrderByDirection>;
  clinic_id?: InputMaybe<OrderByDirection>;
  concept?: InputMaybe<OrderByDirection>;
  consultation_id?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  currency?: InputMaybe<OrderByDirection>;
  description?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  notes?: InputMaybe<OrderByDirection>;
  patient_id?: InputMaybe<OrderByDirection>;
  patient_name?: InputMaybe<OrderByDirection>;
  payment_method?: InputMaybe<OrderByDirection>;
  professional_id?: InputMaybe<OrderByDirection>;
  professional_name?: InputMaybe<OrderByDirection>;
  received_date?: InputMaybe<OrderByDirection>;
  reference?: InputMaybe<OrderByDirection>;
  source?: InputMaybe<OrderByDirection>;
  status?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  workspace_id?: InputMaybe<OrderByDirection>;
};

export type Finance_IncomeUpdateInput = {
  amount?: InputMaybe<Scalars['BigFloat']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  concept?: InputMaybe<Scalars['String']['input']>;
  consultation_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  currency?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  patient_name?: InputMaybe<Scalars['String']['input']>;
  payment_method?: InputMaybe<Scalars['String']['input']>;
  professional_id?: InputMaybe<Scalars['UUID']['input']>;
  professional_name?: InputMaybe<Scalars['String']['input']>;
  received_date?: InputMaybe<Scalars['Date']['input']>;
  reference?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Finance_IncomeUpdateResponse = {
  __typename?: 'finance_incomeUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Finance_Income>;
};

export type Finance_Payment_Method_Config = Node & {
  __typename?: 'finance_payment_method_config';
  clinic_id: Scalars['UUID']['output'];
  clinics?: Maybe<Clinics>;
  configuration?: Maybe<Scalars['JSON']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  display_name: Scalars['String']['output'];
  display_order?: Maybe<Scalars['Int']['output']>;
  id: Scalars['UUID']['output'];
  individual_workspaces?: Maybe<Individual_Workspaces>;
  is_enabled?: Maybe<Scalars['Boolean']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  payment_method: Scalars['String']['output'];
  processing_fee_percentage?: Maybe<Scalars['BigFloat']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  workspace_id?: Maybe<Scalars['UUID']['output']>;
};

export type Finance_Payment_Method_ConfigConnection = {
  __typename?: 'finance_payment_method_configConnection';
  edges: Array<Finance_Payment_Method_ConfigEdge>;
  pageInfo: PageInfo;
};

export type Finance_Payment_Method_ConfigDeleteResponse = {
  __typename?: 'finance_payment_method_configDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Finance_Payment_Method_Config>;
};

export type Finance_Payment_Method_ConfigEdge = {
  __typename?: 'finance_payment_method_configEdge';
  cursor: Scalars['String']['output'];
  node: Finance_Payment_Method_Config;
};

export type Finance_Payment_Method_ConfigFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Finance_Payment_Method_ConfigFilter>>;
  clinic_id?: InputMaybe<UuidFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  display_name?: InputMaybe<StringFilter>;
  display_order?: InputMaybe<IntFilter>;
  id?: InputMaybe<UuidFilter>;
  is_enabled?: InputMaybe<BooleanFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Finance_Payment_Method_ConfigFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Finance_Payment_Method_ConfigFilter>>;
  payment_method?: InputMaybe<StringFilter>;
  processing_fee_percentage?: InputMaybe<BigFloatFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  workspace_id?: InputMaybe<UuidFilter>;
};

export type Finance_Payment_Method_ConfigInsertInput = {
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  configuration?: InputMaybe<Scalars['JSON']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  display_name?: InputMaybe<Scalars['String']['input']>;
  display_order?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_enabled?: InputMaybe<Scalars['Boolean']['input']>;
  payment_method?: InputMaybe<Scalars['String']['input']>;
  processing_fee_percentage?: InputMaybe<Scalars['BigFloat']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Finance_Payment_Method_ConfigInsertResponse = {
  __typename?: 'finance_payment_method_configInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Finance_Payment_Method_Config>;
};

export type Finance_Payment_Method_ConfigOrderBy = {
  clinic_id?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  display_name?: InputMaybe<OrderByDirection>;
  display_order?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  is_enabled?: InputMaybe<OrderByDirection>;
  payment_method?: InputMaybe<OrderByDirection>;
  processing_fee_percentage?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  workspace_id?: InputMaybe<OrderByDirection>;
};

export type Finance_Payment_Method_ConfigUpdateInput = {
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  configuration?: InputMaybe<Scalars['JSON']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  display_name?: InputMaybe<Scalars['String']['input']>;
  display_order?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_enabled?: InputMaybe<Scalars['Boolean']['input']>;
  payment_method?: InputMaybe<Scalars['String']['input']>;
  processing_fee_percentage?: InputMaybe<Scalars['BigFloat']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Finance_Payment_Method_ConfigUpdateResponse = {
  __typename?: 'finance_payment_method_configUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Finance_Payment_Method_Config>;
};

export type Finance_Services = Node & {
  __typename?: 'finance_services';
  allows_discount?: Maybe<Scalars['Boolean']['output']>;
  category?: Maybe<Scalars['String']['output']>;
  clinic_id: Scalars['UUID']['output'];
  clinics?: Maybe<Clinics>;
  code?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  currency?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  estimated_duration_minutes?: Maybe<Scalars['Int']['output']>;
  id: Scalars['UUID']['output'];
  is_active?: Maybe<Scalars['Boolean']['output']>;
  max_discount_percentage?: Maybe<Scalars['BigFloat']['output']>;
  name: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  standard_price: Scalars['BigFloat']['output'];
  updated_at?: Maybe<Scalars['Datetime']['output']>;
};

export type Finance_ServicesConnection = {
  __typename?: 'finance_servicesConnection';
  edges: Array<Finance_ServicesEdge>;
  pageInfo: PageInfo;
};

export type Finance_ServicesDeleteResponse = {
  __typename?: 'finance_servicesDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Finance_Services>;
};

export type Finance_ServicesEdge = {
  __typename?: 'finance_servicesEdge';
  cursor: Scalars['String']['output'];
  node: Finance_Services;
};

export type Finance_ServicesFilter = {
  allows_discount?: InputMaybe<BooleanFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Finance_ServicesFilter>>;
  category?: InputMaybe<StringFilter>;
  clinic_id?: InputMaybe<UuidFilter>;
  code?: InputMaybe<StringFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  currency?: InputMaybe<StringFilter>;
  description?: InputMaybe<StringFilter>;
  estimated_duration_minutes?: InputMaybe<IntFilter>;
  id?: InputMaybe<UuidFilter>;
  is_active?: InputMaybe<BooleanFilter>;
  max_discount_percentage?: InputMaybe<BigFloatFilter>;
  name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Finance_ServicesFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Finance_ServicesFilter>>;
  standard_price?: InputMaybe<BigFloatFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
};

export type Finance_ServicesInsertInput = {
  allows_discount?: InputMaybe<Scalars['Boolean']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  code?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  currency?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  estimated_duration_minutes?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  max_discount_percentage?: InputMaybe<Scalars['BigFloat']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  standard_price?: InputMaybe<Scalars['BigFloat']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type Finance_ServicesInsertResponse = {
  __typename?: 'finance_servicesInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Finance_Services>;
};

export type Finance_ServicesOrderBy = {
  allows_discount?: InputMaybe<OrderByDirection>;
  category?: InputMaybe<OrderByDirection>;
  clinic_id?: InputMaybe<OrderByDirection>;
  code?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  currency?: InputMaybe<OrderByDirection>;
  description?: InputMaybe<OrderByDirection>;
  estimated_duration_minutes?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  is_active?: InputMaybe<OrderByDirection>;
  max_discount_percentage?: InputMaybe<OrderByDirection>;
  name?: InputMaybe<OrderByDirection>;
  standard_price?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
};

export type Finance_ServicesUpdateInput = {
  allows_discount?: InputMaybe<Scalars['Boolean']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  code?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  currency?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  estimated_duration_minutes?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  max_discount_percentage?: InputMaybe<Scalars['BigFloat']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  standard_price?: InputMaybe<Scalars['BigFloat']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type Finance_ServicesUpdateResponse = {
  __typename?: 'finance_servicesUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Finance_Services>;
};

export type Form_Submissions = Node & {
  __typename?: 'form_submissions';
  clinic_configurations?: Maybe<Clinic_Configurations>;
  clinic_id: Scalars['UUID']['output'];
  created_at?: Maybe<Scalars['Datetime']['output']>;
  dynamic_forms?: Maybe<Dynamic_Forms>;
  form_id: Scalars['UUID']['output'];
  id: Scalars['UUID']['output'];
  individual_workspaces?: Maybe<Individual_Workspaces>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  patient_id?: Maybe<Scalars['UUID']['output']>;
  patients?: Maybe<Patients>;
  profiles?: Maybe<Profiles>;
  reviewed_at?: Maybe<Scalars['Datetime']['output']>;
  reviewed_by?: Maybe<Scalars['UUID']['output']>;
  submission_data: Scalars['JSON']['output'];
  submission_status?: Maybe<Scalars['String']['output']>;
  submitted_at?: Maybe<Scalars['Datetime']['output']>;
  submitted_by?: Maybe<Scalars['UUID']['output']>;
  workspace_id?: Maybe<Scalars['UUID']['output']>;
};

export type Form_SubmissionsConnection = {
  __typename?: 'form_submissionsConnection';
  edges: Array<Form_SubmissionsEdge>;
  pageInfo: PageInfo;
};

export type Form_SubmissionsDeleteResponse = {
  __typename?: 'form_submissionsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Form_Submissions>;
};

export type Form_SubmissionsEdge = {
  __typename?: 'form_submissionsEdge';
  cursor: Scalars['String']['output'];
  node: Form_Submissions;
};

export type Form_SubmissionsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Form_SubmissionsFilter>>;
  clinic_id?: InputMaybe<UuidFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  form_id?: InputMaybe<UuidFilter>;
  id?: InputMaybe<UuidFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Form_SubmissionsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Form_SubmissionsFilter>>;
  patient_id?: InputMaybe<UuidFilter>;
  reviewed_at?: InputMaybe<DatetimeFilter>;
  reviewed_by?: InputMaybe<UuidFilter>;
  submission_status?: InputMaybe<StringFilter>;
  submitted_at?: InputMaybe<DatetimeFilter>;
  submitted_by?: InputMaybe<UuidFilter>;
  workspace_id?: InputMaybe<UuidFilter>;
};

export type Form_SubmissionsInsertInput = {
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  form_id?: InputMaybe<Scalars['UUID']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  reviewed_at?: InputMaybe<Scalars['Datetime']['input']>;
  reviewed_by?: InputMaybe<Scalars['UUID']['input']>;
  submission_data?: InputMaybe<Scalars['JSON']['input']>;
  submission_status?: InputMaybe<Scalars['String']['input']>;
  submitted_at?: InputMaybe<Scalars['Datetime']['input']>;
  submitted_by?: InputMaybe<Scalars['UUID']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Form_SubmissionsInsertResponse = {
  __typename?: 'form_submissionsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Form_Submissions>;
};

export type Form_SubmissionsOrderBy = {
  clinic_id?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  form_id?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  patient_id?: InputMaybe<OrderByDirection>;
  reviewed_at?: InputMaybe<OrderByDirection>;
  reviewed_by?: InputMaybe<OrderByDirection>;
  submission_status?: InputMaybe<OrderByDirection>;
  submitted_at?: InputMaybe<OrderByDirection>;
  submitted_by?: InputMaybe<OrderByDirection>;
  workspace_id?: InputMaybe<OrderByDirection>;
};

export type Form_SubmissionsUpdateInput = {
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  form_id?: InputMaybe<Scalars['UUID']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  reviewed_at?: InputMaybe<Scalars['Datetime']['input']>;
  reviewed_by?: InputMaybe<Scalars['UUID']['input']>;
  submission_data?: InputMaybe<Scalars['JSON']['input']>;
  submission_status?: InputMaybe<Scalars['String']['input']>;
  submitted_at?: InputMaybe<Scalars['Datetime']['input']>;
  submitted_by?: InputMaybe<Scalars['UUID']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Form_SubmissionsUpdateResponse = {
  __typename?: 'form_submissionsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Form_Submissions>;
};

export type Individual_Workspaces = Node & {
  __typename?: 'individual_workspaces';
  appointmentsCollection?: Maybe<AppointmentsConnection>;
  assessmentsCollection?: Maybe<AssessmentsConnection>;
  business_name?: Maybe<Scalars['String']['output']>;
  consultationsCollection?: Maybe<ConsultationsConnection>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  dynamic_formsCollection?: Maybe<Dynamic_FormsConnection>;
  finance_incomeCollection?: Maybe<Finance_IncomeConnection>;
  finance_payment_method_configCollection?: Maybe<Finance_Payment_Method_ConfigConnection>;
  form_submissionsCollection?: Maybe<Form_SubmissionsConnection>;
  id: Scalars['UUID']['output'];
  medical_access_logCollection?: Maybe<Medical_Access_LogConnection>;
  medical_audit_logCollection?: Maybe<Medical_Audit_LogConnection>;
  medical_compliance_reportsCollection?: Maybe<Medical_Compliance_ReportsConnection>;
  medical_historyCollection?: Maybe<Medical_HistoryConnection>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  owner_id: Scalars['UUID']['output'];
  patientsCollection?: Maybe<PatientsConnection>;
  practice_locationsCollection?: Maybe<Practice_LocationsConnection>;
  prescriptionsCollection?: Maybe<PrescriptionsConnection>;
  profilesCollection?: Maybe<ProfilesConnection>;
  psychometric_scalesCollection?: Maybe<Psychometric_ScalesConnection>;
  resource_categoriesCollection?: Maybe<Resource_CategoriesConnection>;
  scale_itemsCollection?: Maybe<Scale_ItemsConnection>;
  settings?: Maybe<Scalars['JSON']['output']>;
  tax_id?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  workspace_name: Scalars['String']['output'];
};


export type Individual_WorkspacesAppointmentsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<AppointmentsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<AppointmentsOrderBy>>;
};


export type Individual_WorkspacesAssessmentsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<AssessmentsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<AssessmentsOrderBy>>;
};


export type Individual_WorkspacesConsultationsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ConsultationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ConsultationsOrderBy>>;
};


export type Individual_WorkspacesDynamic_FormsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Dynamic_FormsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Dynamic_FormsOrderBy>>;
};


export type Individual_WorkspacesFinance_IncomeCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Finance_IncomeFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Finance_IncomeOrderBy>>;
};


export type Individual_WorkspacesFinance_Payment_Method_ConfigCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Finance_Payment_Method_ConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Finance_Payment_Method_ConfigOrderBy>>;
};


export type Individual_WorkspacesForm_SubmissionsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Form_SubmissionsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Form_SubmissionsOrderBy>>;
};


export type Individual_WorkspacesMedical_Access_LogCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Medical_Access_LogFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Medical_Access_LogOrderBy>>;
};


export type Individual_WorkspacesMedical_Audit_LogCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Medical_Audit_LogFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Medical_Audit_LogOrderBy>>;
};


export type Individual_WorkspacesMedical_Compliance_ReportsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Medical_Compliance_ReportsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Medical_Compliance_ReportsOrderBy>>;
};


export type Individual_WorkspacesMedical_HistoryCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Medical_HistoryFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Medical_HistoryOrderBy>>;
};


export type Individual_WorkspacesPatientsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<PatientsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<PatientsOrderBy>>;
};


export type Individual_WorkspacesPractice_LocationsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Practice_LocationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Practice_LocationsOrderBy>>;
};


export type Individual_WorkspacesPrescriptionsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<PrescriptionsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<PrescriptionsOrderBy>>;
};


export type Individual_WorkspacesProfilesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ProfilesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ProfilesOrderBy>>;
};


export type Individual_WorkspacesPsychometric_ScalesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Psychometric_ScalesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Psychometric_ScalesOrderBy>>;
};


export type Individual_WorkspacesResource_CategoriesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Resource_CategoriesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Resource_CategoriesOrderBy>>;
};


export type Individual_WorkspacesScale_ItemsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Scale_ItemsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Scale_ItemsOrderBy>>;
};

export type Individual_WorkspacesConnection = {
  __typename?: 'individual_workspacesConnection';
  edges: Array<Individual_WorkspacesEdge>;
  pageInfo: PageInfo;
};

export type Individual_WorkspacesDeleteResponse = {
  __typename?: 'individual_workspacesDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Individual_Workspaces>;
};

export type Individual_WorkspacesEdge = {
  __typename?: 'individual_workspacesEdge';
  cursor: Scalars['String']['output'];
  node: Individual_Workspaces;
};

export type Individual_WorkspacesFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Individual_WorkspacesFilter>>;
  business_name?: InputMaybe<StringFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Individual_WorkspacesFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Individual_WorkspacesFilter>>;
  owner_id?: InputMaybe<UuidFilter>;
  tax_id?: InputMaybe<StringFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  workspace_name?: InputMaybe<StringFilter>;
};

export type Individual_WorkspacesInsertInput = {
  business_name?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  owner_id?: InputMaybe<Scalars['UUID']['input']>;
  settings?: InputMaybe<Scalars['JSON']['input']>;
  tax_id?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  workspace_name?: InputMaybe<Scalars['String']['input']>;
};

export type Individual_WorkspacesInsertResponse = {
  __typename?: 'individual_workspacesInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Individual_Workspaces>;
};

export type Individual_WorkspacesOrderBy = {
  business_name?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  owner_id?: InputMaybe<OrderByDirection>;
  tax_id?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  workspace_name?: InputMaybe<OrderByDirection>;
};

export type Individual_WorkspacesUpdateInput = {
  business_name?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  owner_id?: InputMaybe<Scalars['UUID']['input']>;
  settings?: InputMaybe<Scalars['JSON']['input']>;
  tax_id?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  workspace_name?: InputMaybe<Scalars['String']['input']>;
};

export type Individual_WorkspacesUpdateResponse = {
  __typename?: 'individual_workspacesUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Individual_Workspaces>;
};

export enum License_Type_Enum {
  Clinic = 'clinic',
  Individual = 'individual'
}

/** Boolean expression comparing fields on type "license_type_enum" */
export type License_Type_EnumFilter = {
  eq?: InputMaybe<License_Type_Enum>;
  in?: InputMaybe<Array<License_Type_Enum>>;
  is?: InputMaybe<FilterIs>;
  neq?: InputMaybe<License_Type_Enum>;
};

export type Medical_Access_Log = Node & {
  __typename?: 'medical_access_log';
  access_type: Scalars['String']['output'];
  accessed_at: Scalars['Datetime']['output'];
  clinic_id?: Maybe<Scalars['UUID']['output']>;
  clinics?: Maybe<Clinics>;
  data_type: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  individual_workspaces?: Maybe<Individual_Workspaces>;
  ip_address?: Maybe<Scalars['Opaque']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  patient_id: Scalars['UUID']['output'];
  purpose?: Maybe<Scalars['String']['output']>;
  resource_id?: Maybe<Scalars['UUID']['output']>;
  session_id?: Maybe<Scalars['String']['output']>;
  user_agent?: Maybe<Scalars['String']['output']>;
  user_id: Scalars['UUID']['output'];
  workspace_id?: Maybe<Scalars['UUID']['output']>;
};

export type Medical_Access_LogConnection = {
  __typename?: 'medical_access_logConnection';
  edges: Array<Medical_Access_LogEdge>;
  pageInfo: PageInfo;
};

export type Medical_Access_LogDeleteResponse = {
  __typename?: 'medical_access_logDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Medical_Access_Log>;
};

export type Medical_Access_LogEdge = {
  __typename?: 'medical_access_logEdge';
  cursor: Scalars['String']['output'];
  node: Medical_Access_Log;
};

export type Medical_Access_LogFilter = {
  access_type?: InputMaybe<StringFilter>;
  accessed_at?: InputMaybe<DatetimeFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Medical_Access_LogFilter>>;
  clinic_id?: InputMaybe<UuidFilter>;
  data_type?: InputMaybe<StringFilter>;
  id?: InputMaybe<UuidFilter>;
  ip_address?: InputMaybe<OpaqueFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Medical_Access_LogFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Medical_Access_LogFilter>>;
  patient_id?: InputMaybe<UuidFilter>;
  purpose?: InputMaybe<StringFilter>;
  resource_id?: InputMaybe<UuidFilter>;
  session_id?: InputMaybe<StringFilter>;
  user_agent?: InputMaybe<StringFilter>;
  user_id?: InputMaybe<UuidFilter>;
  workspace_id?: InputMaybe<UuidFilter>;
};

export type Medical_Access_LogInsertInput = {
  access_type?: InputMaybe<Scalars['String']['input']>;
  accessed_at?: InputMaybe<Scalars['Datetime']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  data_type?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  ip_address?: InputMaybe<Scalars['Opaque']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  purpose?: InputMaybe<Scalars['String']['input']>;
  resource_id?: InputMaybe<Scalars['UUID']['input']>;
  session_id?: InputMaybe<Scalars['String']['input']>;
  user_agent?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Medical_Access_LogInsertResponse = {
  __typename?: 'medical_access_logInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Medical_Access_Log>;
};

export type Medical_Access_LogOrderBy = {
  access_type?: InputMaybe<OrderByDirection>;
  accessed_at?: InputMaybe<OrderByDirection>;
  clinic_id?: InputMaybe<OrderByDirection>;
  data_type?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  ip_address?: InputMaybe<OrderByDirection>;
  patient_id?: InputMaybe<OrderByDirection>;
  purpose?: InputMaybe<OrderByDirection>;
  resource_id?: InputMaybe<OrderByDirection>;
  session_id?: InputMaybe<OrderByDirection>;
  user_agent?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
  workspace_id?: InputMaybe<OrderByDirection>;
};

export type Medical_Access_LogUpdateInput = {
  access_type?: InputMaybe<Scalars['String']['input']>;
  accessed_at?: InputMaybe<Scalars['Datetime']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  data_type?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  ip_address?: InputMaybe<Scalars['Opaque']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  purpose?: InputMaybe<Scalars['String']['input']>;
  resource_id?: InputMaybe<Scalars['UUID']['input']>;
  session_id?: InputMaybe<Scalars['String']['input']>;
  user_agent?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Medical_Access_LogUpdateResponse = {
  __typename?: 'medical_access_logUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Medical_Access_Log>;
};

export type Medical_Audit_Log = Node & {
  __typename?: 'medical_audit_log';
  action: Scalars['String']['output'];
  changes?: Maybe<Scalars['JSON']['output']>;
  clinic_id?: Maybe<Scalars['UUID']['output']>;
  clinics?: Maybe<Clinics>;
  id: Scalars['UUID']['output'];
  individual_workspaces?: Maybe<Individual_Workspaces>;
  ip_address?: Maybe<Scalars['Opaque']['output']>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  patient_id?: Maybe<Scalars['UUID']['output']>;
  resource_id?: Maybe<Scalars['UUID']['output']>;
  resource_type: Scalars['String']['output'];
  timestamp: Scalars['Datetime']['output'];
  user_agent?: Maybe<Scalars['String']['output']>;
  user_id?: Maybe<Scalars['UUID']['output']>;
  workspace_id?: Maybe<Scalars['UUID']['output']>;
};

export type Medical_Audit_LogConnection = {
  __typename?: 'medical_audit_logConnection';
  edges: Array<Medical_Audit_LogEdge>;
  pageInfo: PageInfo;
};

export type Medical_Audit_LogDeleteResponse = {
  __typename?: 'medical_audit_logDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Medical_Audit_Log>;
};

export type Medical_Audit_LogEdge = {
  __typename?: 'medical_audit_logEdge';
  cursor: Scalars['String']['output'];
  node: Medical_Audit_Log;
};

export type Medical_Audit_LogFilter = {
  action?: InputMaybe<StringFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Medical_Audit_LogFilter>>;
  clinic_id?: InputMaybe<UuidFilter>;
  id?: InputMaybe<UuidFilter>;
  ip_address?: InputMaybe<OpaqueFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Medical_Audit_LogFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Medical_Audit_LogFilter>>;
  patient_id?: InputMaybe<UuidFilter>;
  resource_id?: InputMaybe<UuidFilter>;
  resource_type?: InputMaybe<StringFilter>;
  timestamp?: InputMaybe<DatetimeFilter>;
  user_agent?: InputMaybe<StringFilter>;
  user_id?: InputMaybe<UuidFilter>;
  workspace_id?: InputMaybe<UuidFilter>;
};

export type Medical_Audit_LogInsertInput = {
  action?: InputMaybe<Scalars['String']['input']>;
  changes?: InputMaybe<Scalars['JSON']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  ip_address?: InputMaybe<Scalars['Opaque']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  resource_id?: InputMaybe<Scalars['UUID']['input']>;
  resource_type?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['Datetime']['input']>;
  user_agent?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Medical_Audit_LogInsertResponse = {
  __typename?: 'medical_audit_logInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Medical_Audit_Log>;
};

export type Medical_Audit_LogOrderBy = {
  action?: InputMaybe<OrderByDirection>;
  clinic_id?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  ip_address?: InputMaybe<OrderByDirection>;
  patient_id?: InputMaybe<OrderByDirection>;
  resource_id?: InputMaybe<OrderByDirection>;
  resource_type?: InputMaybe<OrderByDirection>;
  timestamp?: InputMaybe<OrderByDirection>;
  user_agent?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
  workspace_id?: InputMaybe<OrderByDirection>;
};

export type Medical_Audit_LogUpdateInput = {
  action?: InputMaybe<Scalars['String']['input']>;
  changes?: InputMaybe<Scalars['JSON']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  ip_address?: InputMaybe<Scalars['Opaque']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  resource_id?: InputMaybe<Scalars['UUID']['input']>;
  resource_type?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['Datetime']['input']>;
  user_agent?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Medical_Audit_LogUpdateResponse = {
  __typename?: 'medical_audit_logUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Medical_Audit_Log>;
};

export type Medical_Compliance_Reports = Node & {
  __typename?: 'medical_compliance_reports';
  clinic_id?: Maybe<Scalars['UUID']['output']>;
  clinics?: Maybe<Clinics>;
  completed_at?: Maybe<Scalars['Datetime']['output']>;
  created_at: Scalars['Datetime']['output'];
  date_from: Scalars['Datetime']['output'];
  date_to: Scalars['Datetime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  generated_by: Scalars['UUID']['output'];
  id: Scalars['UUID']['output'];
  individual_workspaces?: Maybe<Individual_Workspaces>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  report_data?: Maybe<Scalars['JSON']['output']>;
  report_type: Scalars['String']['output'];
  status?: Maybe<Scalars['String']['output']>;
  summary?: Maybe<Scalars['JSON']['output']>;
  title: Scalars['String']['output'];
  workspace_id?: Maybe<Scalars['UUID']['output']>;
};

export type Medical_Compliance_ReportsConnection = {
  __typename?: 'medical_compliance_reportsConnection';
  edges: Array<Medical_Compliance_ReportsEdge>;
  pageInfo: PageInfo;
};

export type Medical_Compliance_ReportsDeleteResponse = {
  __typename?: 'medical_compliance_reportsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Medical_Compliance_Reports>;
};

export type Medical_Compliance_ReportsEdge = {
  __typename?: 'medical_compliance_reportsEdge';
  cursor: Scalars['String']['output'];
  node: Medical_Compliance_Reports;
};

export type Medical_Compliance_ReportsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Medical_Compliance_ReportsFilter>>;
  clinic_id?: InputMaybe<UuidFilter>;
  completed_at?: InputMaybe<DatetimeFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  date_from?: InputMaybe<DatetimeFilter>;
  date_to?: InputMaybe<DatetimeFilter>;
  description?: InputMaybe<StringFilter>;
  generated_by?: InputMaybe<UuidFilter>;
  id?: InputMaybe<UuidFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Medical_Compliance_ReportsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Medical_Compliance_ReportsFilter>>;
  report_type?: InputMaybe<StringFilter>;
  status?: InputMaybe<StringFilter>;
  title?: InputMaybe<StringFilter>;
  workspace_id?: InputMaybe<UuidFilter>;
};

export type Medical_Compliance_ReportsInsertInput = {
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  completed_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  date_from?: InputMaybe<Scalars['Datetime']['input']>;
  date_to?: InputMaybe<Scalars['Datetime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  generated_by?: InputMaybe<Scalars['UUID']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  report_data?: InputMaybe<Scalars['JSON']['input']>;
  report_type?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  summary?: InputMaybe<Scalars['JSON']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Medical_Compliance_ReportsInsertResponse = {
  __typename?: 'medical_compliance_reportsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Medical_Compliance_Reports>;
};

export type Medical_Compliance_ReportsOrderBy = {
  clinic_id?: InputMaybe<OrderByDirection>;
  completed_at?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  date_from?: InputMaybe<OrderByDirection>;
  date_to?: InputMaybe<OrderByDirection>;
  description?: InputMaybe<OrderByDirection>;
  generated_by?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  report_type?: InputMaybe<OrderByDirection>;
  status?: InputMaybe<OrderByDirection>;
  title?: InputMaybe<OrderByDirection>;
  workspace_id?: InputMaybe<OrderByDirection>;
};

export type Medical_Compliance_ReportsUpdateInput = {
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  completed_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  date_from?: InputMaybe<Scalars['Datetime']['input']>;
  date_to?: InputMaybe<Scalars['Datetime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  generated_by?: InputMaybe<Scalars['UUID']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  report_data?: InputMaybe<Scalars['JSON']['input']>;
  report_type?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  summary?: InputMaybe<Scalars['JSON']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Medical_Compliance_ReportsUpdateResponse = {
  __typename?: 'medical_compliance_reportsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Medical_Compliance_Reports>;
};

export type Medical_History = Node & {
  __typename?: 'medical_history';
  attachments?: Maybe<Scalars['JSON']['output']>;
  clinic_configurations?: Maybe<Clinic_Configurations>;
  clinic_id?: Maybe<Scalars['UUID']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  entry_date?: Maybe<Scalars['Datetime']['output']>;
  entry_type?: Maybe<Scalars['String']['output']>;
  id: Scalars['UUID']['output'];
  individual_workspaces?: Maybe<Individual_Workspaces>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  patient_id?: Maybe<Scalars['UUID']['output']>;
  patients?: Maybe<Patients>;
  recorded_by?: Maybe<Scalars['UUID']['output']>;
  workspace_id?: Maybe<Scalars['UUID']['output']>;
};

export type Medical_HistoryConnection = {
  __typename?: 'medical_historyConnection';
  edges: Array<Medical_HistoryEdge>;
  pageInfo: PageInfo;
};

export type Medical_HistoryDeleteResponse = {
  __typename?: 'medical_historyDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Medical_History>;
};

export type Medical_HistoryEdge = {
  __typename?: 'medical_historyEdge';
  cursor: Scalars['String']['output'];
  node: Medical_History;
};

export type Medical_HistoryFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Medical_HistoryFilter>>;
  clinic_id?: InputMaybe<UuidFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  description?: InputMaybe<StringFilter>;
  entry_date?: InputMaybe<DatetimeFilter>;
  entry_type?: InputMaybe<StringFilter>;
  id?: InputMaybe<UuidFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Medical_HistoryFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Medical_HistoryFilter>>;
  patient_id?: InputMaybe<UuidFilter>;
  recorded_by?: InputMaybe<UuidFilter>;
  workspace_id?: InputMaybe<UuidFilter>;
};

export type Medical_HistoryInsertInput = {
  attachments?: InputMaybe<Scalars['JSON']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  entry_date?: InputMaybe<Scalars['Datetime']['input']>;
  entry_type?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  recorded_by?: InputMaybe<Scalars['UUID']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Medical_HistoryInsertResponse = {
  __typename?: 'medical_historyInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Medical_History>;
};

export type Medical_HistoryOrderBy = {
  clinic_id?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  description?: InputMaybe<OrderByDirection>;
  entry_date?: InputMaybe<OrderByDirection>;
  entry_type?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  patient_id?: InputMaybe<OrderByDirection>;
  recorded_by?: InputMaybe<OrderByDirection>;
  workspace_id?: InputMaybe<OrderByDirection>;
};

export type Medical_HistoryUpdateInput = {
  attachments?: InputMaybe<Scalars['JSON']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  entry_date?: InputMaybe<Scalars['Datetime']['input']>;
  entry_type?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  recorded_by?: InputMaybe<Scalars['UUID']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Medical_HistoryUpdateResponse = {
  __typename?: 'medical_historyUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Medical_History>;
};

export type Medical_Resources = Node & {
  __typename?: 'medical_resources';
  category?: Maybe<Scalars['String']['output']>;
  clinic_configurations?: Maybe<Clinic_Configurations>;
  clinic_id: Scalars['UUID']['output'];
  content?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  created_by: Scalars['UUID']['output'];
  description?: Maybe<Scalars['String']['output']>;
  download_count?: Maybe<Scalars['Int']['output']>;
  file_size?: Maybe<Scalars['Int']['output']>;
  file_type?: Maybe<Scalars['String']['output']>;
  file_url?: Maybe<Scalars['String']['output']>;
  id: Scalars['UUID']['output'];
  is_public?: Maybe<Scalars['Boolean']['output']>;
  is_template?: Maybe<Scalars['Boolean']['output']>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  profiles?: Maybe<Profiles>;
  resource_type?: Maybe<Scalars['String']['output']>;
  tags?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  thumbnail_url?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  updated_at?: Maybe<Scalars['Datetime']['output']>;
};

export type Medical_ResourcesConnection = {
  __typename?: 'medical_resourcesConnection';
  edges: Array<Medical_ResourcesEdge>;
  pageInfo: PageInfo;
};

export type Medical_ResourcesDeleteResponse = {
  __typename?: 'medical_resourcesDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Medical_Resources>;
};

export type Medical_ResourcesEdge = {
  __typename?: 'medical_resourcesEdge';
  cursor: Scalars['String']['output'];
  node: Medical_Resources;
};

export type Medical_ResourcesFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Medical_ResourcesFilter>>;
  category?: InputMaybe<StringFilter>;
  clinic_id?: InputMaybe<UuidFilter>;
  content?: InputMaybe<StringFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  created_by?: InputMaybe<UuidFilter>;
  description?: InputMaybe<StringFilter>;
  download_count?: InputMaybe<IntFilter>;
  file_size?: InputMaybe<IntFilter>;
  file_type?: InputMaybe<StringFilter>;
  file_url?: InputMaybe<StringFilter>;
  id?: InputMaybe<UuidFilter>;
  is_public?: InputMaybe<BooleanFilter>;
  is_template?: InputMaybe<BooleanFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Medical_ResourcesFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Medical_ResourcesFilter>>;
  resource_type?: InputMaybe<StringFilter>;
  tags?: InputMaybe<StringListFilter>;
  thumbnail_url?: InputMaybe<StringFilter>;
  title?: InputMaybe<StringFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
};

export type Medical_ResourcesInsertInput = {
  category?: InputMaybe<Scalars['String']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  content?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_by?: InputMaybe<Scalars['UUID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  download_count?: InputMaybe<Scalars['Int']['input']>;
  file_size?: InputMaybe<Scalars['Int']['input']>;
  file_type?: InputMaybe<Scalars['String']['input']>;
  file_url?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_public?: InputMaybe<Scalars['Boolean']['input']>;
  is_template?: InputMaybe<Scalars['Boolean']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  resource_type?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  thumbnail_url?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type Medical_ResourcesInsertResponse = {
  __typename?: 'medical_resourcesInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Medical_Resources>;
};

export type Medical_ResourcesOrderBy = {
  category?: InputMaybe<OrderByDirection>;
  clinic_id?: InputMaybe<OrderByDirection>;
  content?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  created_by?: InputMaybe<OrderByDirection>;
  description?: InputMaybe<OrderByDirection>;
  download_count?: InputMaybe<OrderByDirection>;
  file_size?: InputMaybe<OrderByDirection>;
  file_type?: InputMaybe<OrderByDirection>;
  file_url?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  is_public?: InputMaybe<OrderByDirection>;
  is_template?: InputMaybe<OrderByDirection>;
  resource_type?: InputMaybe<OrderByDirection>;
  thumbnail_url?: InputMaybe<OrderByDirection>;
  title?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
};

export type Medical_ResourcesUpdateInput = {
  category?: InputMaybe<Scalars['String']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  content?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_by?: InputMaybe<Scalars['UUID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  download_count?: InputMaybe<Scalars['Int']['input']>;
  file_size?: InputMaybe<Scalars['Int']['input']>;
  file_type?: InputMaybe<Scalars['String']['input']>;
  file_url?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_public?: InputMaybe<Scalars['Boolean']['input']>;
  is_template?: InputMaybe<Scalars['Boolean']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  resource_type?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  thumbnail_url?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type Medical_ResourcesUpdateResponse = {
  __typename?: 'medical_resourcesUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Medical_Resources>;
};

export type Patients = Node & {
  __typename?: 'patients';
  address?: Maybe<Scalars['String']['output']>;
  allergies?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  appointmentsCollection?: Maybe<AppointmentsConnection>;
  assessmentsCollection?: Maybe<AssessmentsConnection>;
  assigned_professional_id?: Maybe<Scalars['UUID']['output']>;
  blood_type?: Maybe<Scalars['String']['output']>;
  chronic_conditions?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  city?: Maybe<Scalars['String']['output']>;
  clinic_configurations?: Maybe<Clinic_Configurations>;
  clinic_id?: Maybe<Scalars['UUID']['output']>;
  clinimetrix_assessmentsCollection?: Maybe<Clinimetrix_AssessmentsConnection>;
  clinimetrix_remote_assessmentsCollection?: Maybe<Clinimetrix_Remote_AssessmentsConnection>;
  consent_to_data_processing?: Maybe<Scalars['Boolean']['output']>;
  consent_to_treatment?: Maybe<Scalars['Boolean']['output']>;
  consultationsCollection?: Maybe<ConsultationsConnection>;
  country?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  created_by?: Maybe<Scalars['UUID']['output']>;
  curp?: Maybe<Scalars['String']['output']>;
  current_medications?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  date_of_birth?: Maybe<Scalars['Date']['output']>;
  education_level?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  emergency_contact?: Maybe<Scalars['String']['output']>;
  emergency_contact_name?: Maybe<Scalars['String']['output']>;
  emergency_contact_phone?: Maybe<Scalars['String']['output']>;
  emergency_contact_relationship?: Maybe<Scalars['String']['output']>;
  emergency_phone?: Maybe<Scalars['String']['output']>;
  finance_incomeCollection?: Maybe<Finance_IncomeConnection>;
  first_name: Scalars['String']['output'];
  form_submissionsCollection?: Maybe<Form_SubmissionsConnection>;
  gender?: Maybe<Scalars['String']['output']>;
  id: Scalars['UUID']['output'];
  individual_workspaces?: Maybe<Individual_Workspaces>;
  insurance_number?: Maybe<Scalars['String']['output']>;
  insurance_provider?: Maybe<Scalars['String']['output']>;
  is_active?: Maybe<Scalars['Boolean']['output']>;
  last_name?: Maybe<Scalars['String']['output']>;
  marital_status?: Maybe<Scalars['String']['output']>;
  maternal_last_name?: Maybe<Scalars['String']['output']>;
  medical_history?: Maybe<Scalars['String']['output']>;
  medical_historyCollection?: Maybe<Medical_HistoryConnection>;
  medical_record_number?: Maybe<Scalars['String']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  occupation?: Maybe<Scalars['String']['output']>;
  paternal_last_name?: Maybe<Scalars['String']['output']>;
  patient_category?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  postal_code?: Maybe<Scalars['String']['output']>;
  prescriptionsCollection?: Maybe<PrescriptionsConnection>;
  rfc?: Maybe<Scalars['String']['output']>;
  state?: Maybe<Scalars['String']['output']>;
  tags?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  workspace_id?: Maybe<Scalars['UUID']['output']>;
};


export type PatientsAppointmentsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<AppointmentsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<AppointmentsOrderBy>>;
};


export type PatientsAssessmentsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<AssessmentsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<AssessmentsOrderBy>>;
};


export type PatientsClinimetrix_AssessmentsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Clinimetrix_AssessmentsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Clinimetrix_AssessmentsOrderBy>>;
};


export type PatientsClinimetrix_Remote_AssessmentsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Clinimetrix_Remote_AssessmentsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Clinimetrix_Remote_AssessmentsOrderBy>>;
};


export type PatientsConsultationsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ConsultationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ConsultationsOrderBy>>;
};


export type PatientsFinance_IncomeCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Finance_IncomeFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Finance_IncomeOrderBy>>;
};


export type PatientsForm_SubmissionsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Form_SubmissionsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Form_SubmissionsOrderBy>>;
};


export type PatientsMedical_HistoryCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Medical_HistoryFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Medical_HistoryOrderBy>>;
};


export type PatientsPrescriptionsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<PrescriptionsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<PrescriptionsOrderBy>>;
};

export type PatientsConnection = {
  __typename?: 'patientsConnection';
  edges: Array<PatientsEdge>;
  pageInfo: PageInfo;
};

export type PatientsDeleteResponse = {
  __typename?: 'patientsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Patients>;
};

export type PatientsEdge = {
  __typename?: 'patientsEdge';
  cursor: Scalars['String']['output'];
  node: Patients;
};

export type PatientsFilter = {
  address?: InputMaybe<StringFilter>;
  allergies?: InputMaybe<StringListFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<PatientsFilter>>;
  assigned_professional_id?: InputMaybe<UuidFilter>;
  blood_type?: InputMaybe<StringFilter>;
  chronic_conditions?: InputMaybe<StringListFilter>;
  city?: InputMaybe<StringFilter>;
  clinic_id?: InputMaybe<UuidFilter>;
  consent_to_data_processing?: InputMaybe<BooleanFilter>;
  consent_to_treatment?: InputMaybe<BooleanFilter>;
  country?: InputMaybe<StringFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  created_by?: InputMaybe<UuidFilter>;
  curp?: InputMaybe<StringFilter>;
  current_medications?: InputMaybe<StringListFilter>;
  date_of_birth?: InputMaybe<DateFilter>;
  education_level?: InputMaybe<StringFilter>;
  email?: InputMaybe<StringFilter>;
  emergency_contact?: InputMaybe<StringFilter>;
  emergency_contact_name?: InputMaybe<StringFilter>;
  emergency_contact_phone?: InputMaybe<StringFilter>;
  emergency_contact_relationship?: InputMaybe<StringFilter>;
  emergency_phone?: InputMaybe<StringFilter>;
  first_name?: InputMaybe<StringFilter>;
  gender?: InputMaybe<StringFilter>;
  id?: InputMaybe<UuidFilter>;
  insurance_number?: InputMaybe<StringFilter>;
  insurance_provider?: InputMaybe<StringFilter>;
  is_active?: InputMaybe<BooleanFilter>;
  last_name?: InputMaybe<StringFilter>;
  marital_status?: InputMaybe<StringFilter>;
  maternal_last_name?: InputMaybe<StringFilter>;
  medical_history?: InputMaybe<StringFilter>;
  medical_record_number?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<PatientsFilter>;
  notes?: InputMaybe<StringFilter>;
  occupation?: InputMaybe<StringFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<PatientsFilter>>;
  paternal_last_name?: InputMaybe<StringFilter>;
  patient_category?: InputMaybe<StringFilter>;
  phone?: InputMaybe<StringFilter>;
  postal_code?: InputMaybe<StringFilter>;
  rfc?: InputMaybe<StringFilter>;
  state?: InputMaybe<StringFilter>;
  tags?: InputMaybe<StringListFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  workspace_id?: InputMaybe<UuidFilter>;
};

export type PatientsInsertInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  allergies?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  assigned_professional_id?: InputMaybe<Scalars['UUID']['input']>;
  blood_type?: InputMaybe<Scalars['String']['input']>;
  chronic_conditions?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  city?: InputMaybe<Scalars['String']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  consent_to_data_processing?: InputMaybe<Scalars['Boolean']['input']>;
  consent_to_treatment?: InputMaybe<Scalars['Boolean']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_by?: InputMaybe<Scalars['UUID']['input']>;
  curp?: InputMaybe<Scalars['String']['input']>;
  current_medications?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  date_of_birth?: InputMaybe<Scalars['Date']['input']>;
  education_level?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  emergency_contact?: InputMaybe<Scalars['String']['input']>;
  emergency_contact_name?: InputMaybe<Scalars['String']['input']>;
  emergency_contact_phone?: InputMaybe<Scalars['String']['input']>;
  emergency_contact_relationship?: InputMaybe<Scalars['String']['input']>;
  emergency_phone?: InputMaybe<Scalars['String']['input']>;
  first_name?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  insurance_number?: InputMaybe<Scalars['String']['input']>;
  insurance_provider?: InputMaybe<Scalars['String']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  last_name?: InputMaybe<Scalars['String']['input']>;
  marital_status?: InputMaybe<Scalars['String']['input']>;
  maternal_last_name?: InputMaybe<Scalars['String']['input']>;
  medical_history?: InputMaybe<Scalars['String']['input']>;
  medical_record_number?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  occupation?: InputMaybe<Scalars['String']['input']>;
  paternal_last_name?: InputMaybe<Scalars['String']['input']>;
  patient_category?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  postal_code?: InputMaybe<Scalars['String']['input']>;
  rfc?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type PatientsInsertResponse = {
  __typename?: 'patientsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Patients>;
};

export type PatientsOrderBy = {
  address?: InputMaybe<OrderByDirection>;
  assigned_professional_id?: InputMaybe<OrderByDirection>;
  blood_type?: InputMaybe<OrderByDirection>;
  city?: InputMaybe<OrderByDirection>;
  clinic_id?: InputMaybe<OrderByDirection>;
  consent_to_data_processing?: InputMaybe<OrderByDirection>;
  consent_to_treatment?: InputMaybe<OrderByDirection>;
  country?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  created_by?: InputMaybe<OrderByDirection>;
  curp?: InputMaybe<OrderByDirection>;
  date_of_birth?: InputMaybe<OrderByDirection>;
  education_level?: InputMaybe<OrderByDirection>;
  email?: InputMaybe<OrderByDirection>;
  emergency_contact?: InputMaybe<OrderByDirection>;
  emergency_contact_name?: InputMaybe<OrderByDirection>;
  emergency_contact_phone?: InputMaybe<OrderByDirection>;
  emergency_contact_relationship?: InputMaybe<OrderByDirection>;
  emergency_phone?: InputMaybe<OrderByDirection>;
  first_name?: InputMaybe<OrderByDirection>;
  gender?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  insurance_number?: InputMaybe<OrderByDirection>;
  insurance_provider?: InputMaybe<OrderByDirection>;
  is_active?: InputMaybe<OrderByDirection>;
  last_name?: InputMaybe<OrderByDirection>;
  marital_status?: InputMaybe<OrderByDirection>;
  maternal_last_name?: InputMaybe<OrderByDirection>;
  medical_history?: InputMaybe<OrderByDirection>;
  medical_record_number?: InputMaybe<OrderByDirection>;
  notes?: InputMaybe<OrderByDirection>;
  occupation?: InputMaybe<OrderByDirection>;
  paternal_last_name?: InputMaybe<OrderByDirection>;
  patient_category?: InputMaybe<OrderByDirection>;
  phone?: InputMaybe<OrderByDirection>;
  postal_code?: InputMaybe<OrderByDirection>;
  rfc?: InputMaybe<OrderByDirection>;
  state?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  workspace_id?: InputMaybe<OrderByDirection>;
};

export type PatientsUpdateInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  allergies?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  assigned_professional_id?: InputMaybe<Scalars['UUID']['input']>;
  blood_type?: InputMaybe<Scalars['String']['input']>;
  chronic_conditions?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  city?: InputMaybe<Scalars['String']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  consent_to_data_processing?: InputMaybe<Scalars['Boolean']['input']>;
  consent_to_treatment?: InputMaybe<Scalars['Boolean']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_by?: InputMaybe<Scalars['UUID']['input']>;
  curp?: InputMaybe<Scalars['String']['input']>;
  current_medications?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  date_of_birth?: InputMaybe<Scalars['Date']['input']>;
  education_level?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  emergency_contact?: InputMaybe<Scalars['String']['input']>;
  emergency_contact_name?: InputMaybe<Scalars['String']['input']>;
  emergency_contact_phone?: InputMaybe<Scalars['String']['input']>;
  emergency_contact_relationship?: InputMaybe<Scalars['String']['input']>;
  emergency_phone?: InputMaybe<Scalars['String']['input']>;
  first_name?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  insurance_number?: InputMaybe<Scalars['String']['input']>;
  insurance_provider?: InputMaybe<Scalars['String']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  last_name?: InputMaybe<Scalars['String']['input']>;
  marital_status?: InputMaybe<Scalars['String']['input']>;
  maternal_last_name?: InputMaybe<Scalars['String']['input']>;
  medical_history?: InputMaybe<Scalars['String']['input']>;
  medical_record_number?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  occupation?: InputMaybe<Scalars['String']['input']>;
  paternal_last_name?: InputMaybe<Scalars['String']['input']>;
  patient_category?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  postal_code?: InputMaybe<Scalars['String']['input']>;
  rfc?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type PatientsUpdateResponse = {
  __typename?: 'patientsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Patients>;
};

export type Practice_Locations = Node & {
  __typename?: 'practice_locations';
  address?: Maybe<Scalars['String']['output']>;
  clinic_configurations?: Maybe<Clinic_Configurations>;
  clinic_id?: Maybe<Scalars['UUID']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['UUID']['output'];
  individual_workspaces?: Maybe<Individual_Workspaces>;
  is_active?: Maybe<Scalars['Boolean']['output']>;
  is_primary?: Maybe<Scalars['Boolean']['output']>;
  location_name: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  phone?: Maybe<Scalars['String']['output']>;
  settings?: Maybe<Scalars['JSON']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  workspace_id?: Maybe<Scalars['UUID']['output']>;
};

export type Practice_LocationsConnection = {
  __typename?: 'practice_locationsConnection';
  edges: Array<Practice_LocationsEdge>;
  pageInfo: PageInfo;
};

export type Practice_LocationsDeleteResponse = {
  __typename?: 'practice_locationsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Practice_Locations>;
};

export type Practice_LocationsEdge = {
  __typename?: 'practice_locationsEdge';
  cursor: Scalars['String']['output'];
  node: Practice_Locations;
};

export type Practice_LocationsFilter = {
  address?: InputMaybe<StringFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Practice_LocationsFilter>>;
  clinic_id?: InputMaybe<UuidFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  email?: InputMaybe<StringFilter>;
  id?: InputMaybe<UuidFilter>;
  is_active?: InputMaybe<BooleanFilter>;
  is_primary?: InputMaybe<BooleanFilter>;
  location_name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Practice_LocationsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Practice_LocationsFilter>>;
  phone?: InputMaybe<StringFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  workspace_id?: InputMaybe<UuidFilter>;
};

export type Practice_LocationsInsertInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  is_primary?: InputMaybe<Scalars['Boolean']['input']>;
  location_name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  settings?: InputMaybe<Scalars['JSON']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Practice_LocationsInsertResponse = {
  __typename?: 'practice_locationsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Practice_Locations>;
};

export type Practice_LocationsOrderBy = {
  address?: InputMaybe<OrderByDirection>;
  clinic_id?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  email?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  is_active?: InputMaybe<OrderByDirection>;
  is_primary?: InputMaybe<OrderByDirection>;
  location_name?: InputMaybe<OrderByDirection>;
  phone?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  workspace_id?: InputMaybe<OrderByDirection>;
};

export type Practice_LocationsUpdateInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  is_primary?: InputMaybe<Scalars['Boolean']['input']>;
  location_name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  settings?: InputMaybe<Scalars['JSON']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Practice_LocationsUpdateResponse = {
  __typename?: 'practice_locationsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Practice_Locations>;
};

export type Prescriptions = Node & {
  __typename?: 'prescriptions';
  clinic_configurations?: Maybe<Clinic_Configurations>;
  clinic_id?: Maybe<Scalars['UUID']['output']>;
  consultation_id?: Maybe<Scalars['UUID']['output']>;
  consultations?: Maybe<Consultations>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  dosage?: Maybe<Scalars['String']['output']>;
  duration?: Maybe<Scalars['String']['output']>;
  end_date?: Maybe<Scalars['Date']['output']>;
  frequency?: Maybe<Scalars['String']['output']>;
  id: Scalars['UUID']['output'];
  individual_workspaces?: Maybe<Individual_Workspaces>;
  instructions?: Maybe<Scalars['String']['output']>;
  medication_name: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  patient_id?: Maybe<Scalars['UUID']['output']>;
  patients?: Maybe<Patients>;
  prescribed_by?: Maybe<Scalars['UUID']['output']>;
  start_date?: Maybe<Scalars['Date']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  workspace_id?: Maybe<Scalars['UUID']['output']>;
};

export type PrescriptionsConnection = {
  __typename?: 'prescriptionsConnection';
  edges: Array<PrescriptionsEdge>;
  pageInfo: PageInfo;
};

export type PrescriptionsDeleteResponse = {
  __typename?: 'prescriptionsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Prescriptions>;
};

export type PrescriptionsEdge = {
  __typename?: 'prescriptionsEdge';
  cursor: Scalars['String']['output'];
  node: Prescriptions;
};

export type PrescriptionsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<PrescriptionsFilter>>;
  clinic_id?: InputMaybe<UuidFilter>;
  consultation_id?: InputMaybe<UuidFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  dosage?: InputMaybe<StringFilter>;
  duration?: InputMaybe<StringFilter>;
  end_date?: InputMaybe<DateFilter>;
  frequency?: InputMaybe<StringFilter>;
  id?: InputMaybe<UuidFilter>;
  instructions?: InputMaybe<StringFilter>;
  medication_name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<PrescriptionsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<PrescriptionsFilter>>;
  patient_id?: InputMaybe<UuidFilter>;
  prescribed_by?: InputMaybe<UuidFilter>;
  start_date?: InputMaybe<DateFilter>;
  status?: InputMaybe<StringFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  workspace_id?: InputMaybe<UuidFilter>;
};

export type PrescriptionsInsertInput = {
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  consultation_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  dosage?: InputMaybe<Scalars['String']['input']>;
  duration?: InputMaybe<Scalars['String']['input']>;
  end_date?: InputMaybe<Scalars['Date']['input']>;
  frequency?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  instructions?: InputMaybe<Scalars['String']['input']>;
  medication_name?: InputMaybe<Scalars['String']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  prescribed_by?: InputMaybe<Scalars['UUID']['input']>;
  start_date?: InputMaybe<Scalars['Date']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type PrescriptionsInsertResponse = {
  __typename?: 'prescriptionsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Prescriptions>;
};

export type PrescriptionsOrderBy = {
  clinic_id?: InputMaybe<OrderByDirection>;
  consultation_id?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  dosage?: InputMaybe<OrderByDirection>;
  duration?: InputMaybe<OrderByDirection>;
  end_date?: InputMaybe<OrderByDirection>;
  frequency?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  instructions?: InputMaybe<OrderByDirection>;
  medication_name?: InputMaybe<OrderByDirection>;
  patient_id?: InputMaybe<OrderByDirection>;
  prescribed_by?: InputMaybe<OrderByDirection>;
  start_date?: InputMaybe<OrderByDirection>;
  status?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  workspace_id?: InputMaybe<OrderByDirection>;
};

export type PrescriptionsUpdateInput = {
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  consultation_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  dosage?: InputMaybe<Scalars['String']['input']>;
  duration?: InputMaybe<Scalars['String']['input']>;
  end_date?: InputMaybe<Scalars['Date']['input']>;
  frequency?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  instructions?: InputMaybe<Scalars['String']['input']>;
  medication_name?: InputMaybe<Scalars['String']['input']>;
  patient_id?: InputMaybe<Scalars['UUID']['input']>;
  prescribed_by?: InputMaybe<Scalars['UUID']['input']>;
  start_date?: InputMaybe<Scalars['Date']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type PrescriptionsUpdateResponse = {
  __typename?: 'prescriptionsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Prescriptions>;
};

export type Profiles = Node & {
  __typename?: 'profiles';
  assessmentsCollection?: Maybe<AssessmentsConnection>;
  avatar_url?: Maybe<Scalars['String']['output']>;
  clinic_id?: Maybe<Scalars['UUID']['output']>;
  clinic_role?: Maybe<Scalars['String']['output']>;
  clinics?: Maybe<Clinics>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  dynamic_formsCollection?: Maybe<Dynamic_FormsConnection>;
  email?: Maybe<Scalars['String']['output']>;
  finance_cash_register_cutsCollection?: Maybe<Finance_Cash_Register_CutsConnection>;
  finance_incomeCollection?: Maybe<Finance_IncomeConnection>;
  first_name?: Maybe<Scalars['String']['output']>;
  form_submissionsCollection?: Maybe<Form_SubmissionsConnection>;
  full_name?: Maybe<Scalars['String']['output']>;
  id: Scalars['UUID']['output'];
  individual_workspace_id?: Maybe<Scalars['UUID']['output']>;
  individual_workspaces?: Maybe<Individual_Workspaces>;
  last_name?: Maybe<Scalars['String']['output']>;
  license_number?: Maybe<Scalars['String']['output']>;
  license_type?: Maybe<License_Type_Enum>;
  medical_resourcesCollection?: Maybe<Medical_ResourcesConnection>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  phone?: Maybe<Scalars['String']['output']>;
  psychometric_scalesCollection?: Maybe<Psychometric_ScalesConnection>;
  role?: Maybe<Scalars['String']['output']>;
  specialty?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
};


export type ProfilesAssessmentsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<AssessmentsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<AssessmentsOrderBy>>;
};


export type ProfilesDynamic_FormsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Dynamic_FormsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Dynamic_FormsOrderBy>>;
};


export type ProfilesFinance_Cash_Register_CutsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Finance_Cash_Register_CutsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Finance_Cash_Register_CutsOrderBy>>;
};


export type ProfilesFinance_IncomeCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Finance_IncomeFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Finance_IncomeOrderBy>>;
};


export type ProfilesForm_SubmissionsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Form_SubmissionsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Form_SubmissionsOrderBy>>;
};


export type ProfilesMedical_ResourcesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Medical_ResourcesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Medical_ResourcesOrderBy>>;
};


export type ProfilesPsychometric_ScalesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Psychometric_ScalesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Psychometric_ScalesOrderBy>>;
};

export type ProfilesConnection = {
  __typename?: 'profilesConnection';
  edges: Array<ProfilesEdge>;
  pageInfo: PageInfo;
};

export type ProfilesDeleteResponse = {
  __typename?: 'profilesDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Profiles>;
};

export type ProfilesEdge = {
  __typename?: 'profilesEdge';
  cursor: Scalars['String']['output'];
  node: Profiles;
};

export type ProfilesFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<ProfilesFilter>>;
  avatar_url?: InputMaybe<StringFilter>;
  clinic_id?: InputMaybe<UuidFilter>;
  clinic_role?: InputMaybe<StringFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  email?: InputMaybe<StringFilter>;
  first_name?: InputMaybe<StringFilter>;
  full_name?: InputMaybe<StringFilter>;
  id?: InputMaybe<UuidFilter>;
  individual_workspace_id?: InputMaybe<UuidFilter>;
  last_name?: InputMaybe<StringFilter>;
  license_number?: InputMaybe<StringFilter>;
  license_type?: InputMaybe<License_Type_EnumFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<ProfilesFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<ProfilesFilter>>;
  phone?: InputMaybe<StringFilter>;
  role?: InputMaybe<StringFilter>;
  specialty?: InputMaybe<StringFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
};

export type ProfilesInsertInput = {
  avatar_url?: InputMaybe<Scalars['String']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  clinic_role?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  first_name?: InputMaybe<Scalars['String']['input']>;
  full_name?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  individual_workspace_id?: InputMaybe<Scalars['UUID']['input']>;
  last_name?: InputMaybe<Scalars['String']['input']>;
  license_number?: InputMaybe<Scalars['String']['input']>;
  license_type?: InputMaybe<License_Type_Enum>;
  phone?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
  specialty?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type ProfilesInsertResponse = {
  __typename?: 'profilesInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Profiles>;
};

export type ProfilesOrderBy = {
  avatar_url?: InputMaybe<OrderByDirection>;
  clinic_id?: InputMaybe<OrderByDirection>;
  clinic_role?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  email?: InputMaybe<OrderByDirection>;
  first_name?: InputMaybe<OrderByDirection>;
  full_name?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  individual_workspace_id?: InputMaybe<OrderByDirection>;
  last_name?: InputMaybe<OrderByDirection>;
  license_number?: InputMaybe<OrderByDirection>;
  license_type?: InputMaybe<OrderByDirection>;
  phone?: InputMaybe<OrderByDirection>;
  role?: InputMaybe<OrderByDirection>;
  specialty?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
};

export type ProfilesUpdateInput = {
  avatar_url?: InputMaybe<Scalars['String']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  clinic_role?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  first_name?: InputMaybe<Scalars['String']['input']>;
  full_name?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  individual_workspace_id?: InputMaybe<Scalars['UUID']['input']>;
  last_name?: InputMaybe<Scalars['String']['input']>;
  license_number?: InputMaybe<Scalars['String']['input']>;
  license_type?: InputMaybe<License_Type_Enum>;
  phone?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
  specialty?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type ProfilesUpdateResponse = {
  __typename?: 'profilesUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Profiles>;
};

export type Psychometric_Scales = Node & {
  __typename?: 'psychometric_scales';
  abbreviation: Scalars['String']['output'];
  assessmentsCollection?: Maybe<AssessmentsConnection>;
  category?: Maybe<Scalars['String']['output']>;
  clinic_configurations?: Maybe<Clinic_Configurations>;
  clinic_id: Scalars['UUID']['output'];
  created_at?: Maybe<Scalars['Datetime']['output']>;
  created_by?: Maybe<Scalars['UUID']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  estimated_duration_minutes?: Maybe<Scalars['Int']['output']>;
  id: Scalars['UUID']['output'];
  individual_workspaces?: Maybe<Individual_Workspaces>;
  interpretation_notes?: Maybe<Scalars['String']['output']>;
  is_active?: Maybe<Scalars['Boolean']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  profiles?: Maybe<Profiles>;
  scale_itemsCollection?: Maybe<Scale_ItemsConnection>;
  scale_name: Scalars['String']['output'];
  total_items?: Maybe<Scalars['Int']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  version?: Maybe<Scalars['String']['output']>;
  workspace_id?: Maybe<Scalars['UUID']['output']>;
};


export type Psychometric_ScalesAssessmentsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<AssessmentsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<AssessmentsOrderBy>>;
};


export type Psychometric_ScalesScale_ItemsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Scale_ItemsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Scale_ItemsOrderBy>>;
};

export type Psychometric_ScalesConnection = {
  __typename?: 'psychometric_scalesConnection';
  edges: Array<Psychometric_ScalesEdge>;
  pageInfo: PageInfo;
};

export type Psychometric_ScalesDeleteResponse = {
  __typename?: 'psychometric_scalesDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Psychometric_Scales>;
};

export type Psychometric_ScalesEdge = {
  __typename?: 'psychometric_scalesEdge';
  cursor: Scalars['String']['output'];
  node: Psychometric_Scales;
};

export type Psychometric_ScalesFilter = {
  abbreviation?: InputMaybe<StringFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Psychometric_ScalesFilter>>;
  category?: InputMaybe<StringFilter>;
  clinic_id?: InputMaybe<UuidFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  created_by?: InputMaybe<UuidFilter>;
  description?: InputMaybe<StringFilter>;
  estimated_duration_minutes?: InputMaybe<IntFilter>;
  id?: InputMaybe<UuidFilter>;
  interpretation_notes?: InputMaybe<StringFilter>;
  is_active?: InputMaybe<BooleanFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Psychometric_ScalesFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Psychometric_ScalesFilter>>;
  scale_name?: InputMaybe<StringFilter>;
  total_items?: InputMaybe<IntFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  version?: InputMaybe<StringFilter>;
  workspace_id?: InputMaybe<UuidFilter>;
};

export type Psychometric_ScalesInsertInput = {
  abbreviation?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_by?: InputMaybe<Scalars['UUID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  estimated_duration_minutes?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  interpretation_notes?: InputMaybe<Scalars['String']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  scale_name?: InputMaybe<Scalars['String']['input']>;
  total_items?: InputMaybe<Scalars['Int']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Psychometric_ScalesInsertResponse = {
  __typename?: 'psychometric_scalesInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Psychometric_Scales>;
};

export type Psychometric_ScalesOrderBy = {
  abbreviation?: InputMaybe<OrderByDirection>;
  category?: InputMaybe<OrderByDirection>;
  clinic_id?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  created_by?: InputMaybe<OrderByDirection>;
  description?: InputMaybe<OrderByDirection>;
  estimated_duration_minutes?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  interpretation_notes?: InputMaybe<OrderByDirection>;
  is_active?: InputMaybe<OrderByDirection>;
  scale_name?: InputMaybe<OrderByDirection>;
  total_items?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  version?: InputMaybe<OrderByDirection>;
  workspace_id?: InputMaybe<OrderByDirection>;
};

export type Psychometric_ScalesUpdateInput = {
  abbreviation?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_by?: InputMaybe<Scalars['UUID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  estimated_duration_minutes?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  interpretation_notes?: InputMaybe<Scalars['String']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  scale_name?: InputMaybe<Scalars['String']['input']>;
  total_items?: InputMaybe<Scalars['Int']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Psychometric_ScalesUpdateResponse = {
  __typename?: 'psychometric_scalesUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Psychometric_Scales>;
};

export type Resource_Categories = Node & {
  __typename?: 'resource_categories';
  clinic_configurations?: Maybe<Clinic_Configurations>;
  clinic_id: Scalars['UUID']['output'];
  created_at?: Maybe<Scalars['Datetime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  display_order?: Maybe<Scalars['Int']['output']>;
  id: Scalars['UUID']['output'];
  individual_workspaces?: Maybe<Individual_Workspaces>;
  is_active?: Maybe<Scalars['Boolean']['output']>;
  name: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  parent_category_id?: Maybe<Scalars['UUID']['output']>;
  resource_categories?: Maybe<Resource_Categories>;
  resource_categoriesCollection?: Maybe<Resource_CategoriesConnection>;
  workspace_id?: Maybe<Scalars['UUID']['output']>;
};


export type Resource_CategoriesResource_CategoriesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Resource_CategoriesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Resource_CategoriesOrderBy>>;
};

export type Resource_CategoriesConnection = {
  __typename?: 'resource_categoriesConnection';
  edges: Array<Resource_CategoriesEdge>;
  pageInfo: PageInfo;
};

export type Resource_CategoriesDeleteResponse = {
  __typename?: 'resource_categoriesDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Resource_Categories>;
};

export type Resource_CategoriesEdge = {
  __typename?: 'resource_categoriesEdge';
  cursor: Scalars['String']['output'];
  node: Resource_Categories;
};

export type Resource_CategoriesFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Resource_CategoriesFilter>>;
  clinic_id?: InputMaybe<UuidFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  description?: InputMaybe<StringFilter>;
  display_order?: InputMaybe<IntFilter>;
  id?: InputMaybe<UuidFilter>;
  is_active?: InputMaybe<BooleanFilter>;
  name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Resource_CategoriesFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Resource_CategoriesFilter>>;
  parent_category_id?: InputMaybe<UuidFilter>;
  workspace_id?: InputMaybe<UuidFilter>;
};

export type Resource_CategoriesInsertInput = {
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  display_order?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  parent_category_id?: InputMaybe<Scalars['UUID']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Resource_CategoriesInsertResponse = {
  __typename?: 'resource_categoriesInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Resource_Categories>;
};

export type Resource_CategoriesOrderBy = {
  clinic_id?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  description?: InputMaybe<OrderByDirection>;
  display_order?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  is_active?: InputMaybe<OrderByDirection>;
  name?: InputMaybe<OrderByDirection>;
  parent_category_id?: InputMaybe<OrderByDirection>;
  workspace_id?: InputMaybe<OrderByDirection>;
};

export type Resource_CategoriesUpdateInput = {
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  display_order?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  parent_category_id?: InputMaybe<Scalars['UUID']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Resource_CategoriesUpdateResponse = {
  __typename?: 'resource_categoriesUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Resource_Categories>;
};

export type Scale_Items = Node & {
  __typename?: 'scale_items';
  clinic_configurations?: Maybe<Clinic_Configurations>;
  clinic_id: Scalars['UUID']['output'];
  created_at?: Maybe<Scalars['Datetime']['output']>;
  id: Scalars['UUID']['output'];
  individual_workspaces?: Maybe<Individual_Workspaces>;
  is_reverse_scored?: Maybe<Scalars['Boolean']['output']>;
  item_number: Scalars['Int']['output'];
  item_text: Scalars['String']['output'];
  item_type?: Maybe<Scalars['String']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  options?: Maybe<Scalars['JSON']['output']>;
  psychometric_scales?: Maybe<Psychometric_Scales>;
  scale_id: Scalars['UUID']['output'];
  scoring_weights?: Maybe<Scalars['JSON']['output']>;
  subscale?: Maybe<Scalars['String']['output']>;
  workspace_id?: Maybe<Scalars['UUID']['output']>;
};

export type Scale_ItemsConnection = {
  __typename?: 'scale_itemsConnection';
  edges: Array<Scale_ItemsEdge>;
  pageInfo: PageInfo;
};

export type Scale_ItemsDeleteResponse = {
  __typename?: 'scale_itemsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Scale_Items>;
};

export type Scale_ItemsEdge = {
  __typename?: 'scale_itemsEdge';
  cursor: Scalars['String']['output'];
  node: Scale_Items;
};

export type Scale_ItemsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Scale_ItemsFilter>>;
  clinic_id?: InputMaybe<UuidFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  is_reverse_scored?: InputMaybe<BooleanFilter>;
  item_number?: InputMaybe<IntFilter>;
  item_text?: InputMaybe<StringFilter>;
  item_type?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Scale_ItemsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Scale_ItemsFilter>>;
  scale_id?: InputMaybe<UuidFilter>;
  subscale?: InputMaybe<StringFilter>;
  workspace_id?: InputMaybe<UuidFilter>;
};

export type Scale_ItemsInsertInput = {
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_reverse_scored?: InputMaybe<Scalars['Boolean']['input']>;
  item_number?: InputMaybe<Scalars['Int']['input']>;
  item_text?: InputMaybe<Scalars['String']['input']>;
  item_type?: InputMaybe<Scalars['String']['input']>;
  options?: InputMaybe<Scalars['JSON']['input']>;
  scale_id?: InputMaybe<Scalars['UUID']['input']>;
  scoring_weights?: InputMaybe<Scalars['JSON']['input']>;
  subscale?: InputMaybe<Scalars['String']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Scale_ItemsInsertResponse = {
  __typename?: 'scale_itemsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Scale_Items>;
};

export type Scale_ItemsOrderBy = {
  clinic_id?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  is_reverse_scored?: InputMaybe<OrderByDirection>;
  item_number?: InputMaybe<OrderByDirection>;
  item_text?: InputMaybe<OrderByDirection>;
  item_type?: InputMaybe<OrderByDirection>;
  scale_id?: InputMaybe<OrderByDirection>;
  subscale?: InputMaybe<OrderByDirection>;
  workspace_id?: InputMaybe<OrderByDirection>;
};

export type Scale_ItemsUpdateInput = {
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_reverse_scored?: InputMaybe<Scalars['Boolean']['input']>;
  item_number?: InputMaybe<Scalars['Int']['input']>;
  item_text?: InputMaybe<Scalars['String']['input']>;
  item_type?: InputMaybe<Scalars['String']['input']>;
  options?: InputMaybe<Scalars['JSON']['input']>;
  scale_id?: InputMaybe<Scalars['UUID']['input']>;
  scoring_weights?: InputMaybe<Scalars['JSON']['input']>;
  subscale?: InputMaybe<Scalars['String']['input']>;
  workspace_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Scale_ItemsUpdateResponse = {
  __typename?: 'scale_itemsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Scale_Items>;
};

export type Schedule_Config = Node & {
  __typename?: 'schedule_config';
  appointment_duration_minutes?: Maybe<Scalars['Int']['output']>;
  blocked_dates?: Maybe<Array<Maybe<Scalars['Date']['output']>>>;
  buffer_time_minutes?: Maybe<Scalars['Int']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  friday_schedule?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['UUID']['output'];
  is_active?: Maybe<Scalars['Boolean']['output']>;
  max_daily_appointments?: Maybe<Scalars['Int']['output']>;
  monday_schedule?: Maybe<Scalars['JSON']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  professional_id: Scalars['UUID']['output'];
  saturday_schedule?: Maybe<Scalars['JSON']['output']>;
  sunday_schedule?: Maybe<Scalars['JSON']['output']>;
  thursday_schedule?: Maybe<Scalars['JSON']['output']>;
  tuesday_schedule?: Maybe<Scalars['JSON']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  vacation_periods?: Maybe<Array<Maybe<Scalars['JSON']['output']>>>;
  wednesday_schedule?: Maybe<Scalars['JSON']['output']>;
};

export type Schedule_ConfigConnection = {
  __typename?: 'schedule_configConnection';
  edges: Array<Schedule_ConfigEdge>;
  pageInfo: PageInfo;
};

export type Schedule_ConfigDeleteResponse = {
  __typename?: 'schedule_configDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Schedule_Config>;
};

export type Schedule_ConfigEdge = {
  __typename?: 'schedule_configEdge';
  cursor: Scalars['String']['output'];
  node: Schedule_Config;
};

export type Schedule_ConfigFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Schedule_ConfigFilter>>;
  appointment_duration_minutes?: InputMaybe<IntFilter>;
  blocked_dates?: InputMaybe<DateListFilter>;
  buffer_time_minutes?: InputMaybe<IntFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  is_active?: InputMaybe<BooleanFilter>;
  max_daily_appointments?: InputMaybe<IntFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Schedule_ConfigFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Schedule_ConfigFilter>>;
  professional_id?: InputMaybe<UuidFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
};

export type Schedule_ConfigInsertInput = {
  appointment_duration_minutes?: InputMaybe<Scalars['Int']['input']>;
  blocked_dates?: InputMaybe<Array<InputMaybe<Scalars['Date']['input']>>>;
  buffer_time_minutes?: InputMaybe<Scalars['Int']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  friday_schedule?: InputMaybe<Scalars['JSON']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  max_daily_appointments?: InputMaybe<Scalars['Int']['input']>;
  monday_schedule?: InputMaybe<Scalars['JSON']['input']>;
  professional_id?: InputMaybe<Scalars['UUID']['input']>;
  saturday_schedule?: InputMaybe<Scalars['JSON']['input']>;
  sunday_schedule?: InputMaybe<Scalars['JSON']['input']>;
  thursday_schedule?: InputMaybe<Scalars['JSON']['input']>;
  tuesday_schedule?: InputMaybe<Scalars['JSON']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  vacation_periods?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  wednesday_schedule?: InputMaybe<Scalars['JSON']['input']>;
};

export type Schedule_ConfigInsertResponse = {
  __typename?: 'schedule_configInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Schedule_Config>;
};

export type Schedule_ConfigOrderBy = {
  appointment_duration_minutes?: InputMaybe<OrderByDirection>;
  buffer_time_minutes?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  is_active?: InputMaybe<OrderByDirection>;
  max_daily_appointments?: InputMaybe<OrderByDirection>;
  professional_id?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
};

export type Schedule_ConfigUpdateInput = {
  appointment_duration_minutes?: InputMaybe<Scalars['Int']['input']>;
  blocked_dates?: InputMaybe<Array<InputMaybe<Scalars['Date']['input']>>>;
  buffer_time_minutes?: InputMaybe<Scalars['Int']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  friday_schedule?: InputMaybe<Scalars['JSON']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  max_daily_appointments?: InputMaybe<Scalars['Int']['input']>;
  monday_schedule?: InputMaybe<Scalars['JSON']['input']>;
  professional_id?: InputMaybe<Scalars['UUID']['input']>;
  saturday_schedule?: InputMaybe<Scalars['JSON']['input']>;
  sunday_schedule?: InputMaybe<Scalars['JSON']['input']>;
  thursday_schedule?: InputMaybe<Scalars['JSON']['input']>;
  tuesday_schedule?: InputMaybe<Scalars['JSON']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  vacation_periods?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  wednesday_schedule?: InputMaybe<Scalars['JSON']['input']>;
};

export type Schedule_ConfigUpdateResponse = {
  __typename?: 'schedule_configUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Schedule_Config>;
};

export type Tenant_Memberships = Node & {
  __typename?: 'tenant_memberships';
  clinic_id: Scalars['UUID']['output'];
  clinics?: Maybe<Clinics>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  id: Scalars['UUID']['output'];
  invited_by?: Maybe<Scalars['UUID']['output']>;
  is_active?: Maybe<Scalars['Boolean']['output']>;
  joined_at?: Maybe<Scalars['Datetime']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  permissions?: Maybe<Scalars['JSON']['output']>;
  role: Scalars['String']['output'];
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  user_id: Scalars['UUID']['output'];
};

export type Tenant_MembershipsConnection = {
  __typename?: 'tenant_membershipsConnection';
  edges: Array<Tenant_MembershipsEdge>;
  pageInfo: PageInfo;
};

export type Tenant_MembershipsDeleteResponse = {
  __typename?: 'tenant_membershipsDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Tenant_Memberships>;
};

export type Tenant_MembershipsEdge = {
  __typename?: 'tenant_membershipsEdge';
  cursor: Scalars['String']['output'];
  node: Tenant_Memberships;
};

export type Tenant_MembershipsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Tenant_MembershipsFilter>>;
  clinic_id?: InputMaybe<UuidFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  invited_by?: InputMaybe<UuidFilter>;
  is_active?: InputMaybe<BooleanFilter>;
  joined_at?: InputMaybe<DatetimeFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Tenant_MembershipsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Tenant_MembershipsFilter>>;
  role?: InputMaybe<StringFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type Tenant_MembershipsInsertInput = {
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  invited_by?: InputMaybe<Scalars['UUID']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  joined_at?: InputMaybe<Scalars['Datetime']['input']>;
  permissions?: InputMaybe<Scalars['JSON']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Tenant_MembershipsInsertResponse = {
  __typename?: 'tenant_membershipsInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Tenant_Memberships>;
};

export type Tenant_MembershipsOrderBy = {
  clinic_id?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  invited_by?: InputMaybe<OrderByDirection>;
  is_active?: InputMaybe<OrderByDirection>;
  joined_at?: InputMaybe<OrderByDirection>;
  role?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type Tenant_MembershipsUpdateInput = {
  clinic_id?: InputMaybe<Scalars['UUID']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  invited_by?: InputMaybe<Scalars['UUID']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  joined_at?: InputMaybe<Scalars['Datetime']['input']>;
  permissions?: InputMaybe<Scalars['JSON']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Tenant_MembershipsUpdateResponse = {
  __typename?: 'tenant_membershipsUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Tenant_Memberships>;
};

export type User_Favorite_Scales = Node & {
  __typename?: 'user_favorite_scales';
  clinimetrix_templates?: Maybe<Clinimetrix_Templates>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  id: Scalars['UUID']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  template_id?: Maybe<Scalars['String']['output']>;
  user_id?: Maybe<Scalars['UUID']['output']>;
};

export type User_Favorite_ScalesConnection = {
  __typename?: 'user_favorite_scalesConnection';
  edges: Array<User_Favorite_ScalesEdge>;
  pageInfo: PageInfo;
};

export type User_Favorite_ScalesDeleteResponse = {
  __typename?: 'user_favorite_scalesDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<User_Favorite_Scales>;
};

export type User_Favorite_ScalesEdge = {
  __typename?: 'user_favorite_scalesEdge';
  cursor: Scalars['String']['output'];
  node: User_Favorite_Scales;
};

export type User_Favorite_ScalesFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<User_Favorite_ScalesFilter>>;
  created_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<User_Favorite_ScalesFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<User_Favorite_ScalesFilter>>;
  template_id?: InputMaybe<StringFilter>;
  user_id?: InputMaybe<UuidFilter>;
};

export type User_Favorite_ScalesInsertInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  template_id?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type User_Favorite_ScalesInsertResponse = {
  __typename?: 'user_favorite_scalesInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<User_Favorite_Scales>;
};

export type User_Favorite_ScalesOrderBy = {
  created_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  template_id?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type User_Favorite_ScalesUpdateInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  template_id?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type User_Favorite_ScalesUpdateResponse = {
  __typename?: 'user_favorite_scalesUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<User_Favorite_Scales>;
};

export enum User_Role {
  Admin = 'admin',
  Doctor = 'doctor',
  Member = 'member',
  Nurse = 'nurse',
  Patient = 'patient',
  Psychologist = 'psychologist'
}

/** Boolean expression comparing fields on type "user_role" */
export type User_RoleFilter = {
  eq?: InputMaybe<User_Role>;
  in?: InputMaybe<Array<User_Role>>;
  is?: InputMaybe<FilterIs>;
  neq?: InputMaybe<User_Role>;
};

export type CreatePatientMutationVariables = Exact<{
  input: PatientsInsertInput;
}>;


export type CreatePatientMutation = { __typename?: 'Mutation', insertIntopatientsCollection?: { __typename?: 'patientsInsertResponse', records: Array<{ __typename?: 'patients', id: string, first_name: string, last_name?: string | null, paternal_last_name?: string | null, maternal_last_name?: string | null, email?: string | null, phone?: string | null, date_of_birth?: string | null, gender?: string | null, blood_type?: string | null, emergency_contact?: string | null, emergency_phone?: string | null, address?: string | null, city?: string | null, state?: string | null, postal_code?: string | null, occupation?: string | null, marital_status?: string | null, is_active?: boolean | null, created_at?: any | null, clinic_id?: string | null }> } | null };

export type UpdatePatientMutationVariables = Exact<{
  id: Scalars['UUID']['input'];
  input: PatientsUpdateInput;
}>;


export type UpdatePatientMutation = { __typename?: 'Mutation', updatepatientsCollection: { __typename?: 'patientsUpdateResponse', records: Array<{ __typename?: 'patients', id: string, first_name: string, last_name?: string | null, paternal_last_name?: string | null, maternal_last_name?: string | null, email?: string | null, phone?: string | null, date_of_birth?: string | null, gender?: string | null, blood_type?: string | null, emergency_contact?: string | null, emergency_phone?: string | null, address?: string | null, city?: string | null, state?: string | null, postal_code?: string | null, occupation?: string | null, marital_status?: string | null, medical_history?: string | null, current_medications?: Array<string | null> | null, allergies?: Array<string | null> | null, chronic_conditions?: Array<string | null> | null, insurance_provider?: string | null, insurance_number?: string | null, is_active?: boolean | null, notes?: string | null, tags?: Array<string | null> | null, updated_at?: any | null, clinic_id?: string | null }> } };

export type UpdatePatientBasicInfoMutationVariables = Exact<{
  id: Scalars['UUID']['input'];
  input: PatientsUpdateInput;
}>;


export type UpdatePatientBasicInfoMutation = { __typename?: 'Mutation', updatepatientsCollection: { __typename?: 'patientsUpdateResponse', records: Array<{ __typename?: 'patients', id: string, first_name: string, last_name?: string | null, paternal_last_name?: string | null, maternal_last_name?: string | null, email?: string | null, phone?: string | null, date_of_birth?: string | null, gender?: string | null, blood_type?: string | null, address?: string | null, city?: string | null, state?: string | null, postal_code?: string | null, occupation?: string | null, marital_status?: string | null, updated_at?: any | null }> } };

export type TogglePatientStatusMutationVariables = Exact<{
  id: Scalars['UUID']['input'];
  isActive: Scalars['Boolean']['input'];
}>;


export type TogglePatientStatusMutation = { __typename?: 'Mutation', updatepatientsCollection: { __typename?: 'patientsUpdateResponse', records: Array<{ __typename?: 'patients', id: string, first_name: string, last_name?: string | null, is_active?: boolean | null, updated_at?: any | null }> } };

export type DeletePatientMutationVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;


export type DeletePatientMutation = { __typename?: 'Mutation', updatepatientsCollection: { __typename?: 'patientsUpdateResponse', records: Array<{ __typename?: 'patients', id: string, first_name: string, last_name?: string | null, is_active?: boolean | null, updated_at?: any | null }> } };

export type UpdatePatientNotesMutationVariables = Exact<{
  id: Scalars['UUID']['input'];
  notes: Scalars['String']['input'];
}>;


export type UpdatePatientNotesMutation = { __typename?: 'Mutation', updatepatientsCollection: { __typename?: 'patientsUpdateResponse', records: Array<{ __typename?: 'patients', id: string, notes?: string | null, updated_at?: any | null }> } };

export type UpdatePatientTagsMutationVariables = Exact<{
  id: Scalars['UUID']['input'];
  tags: Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>;
}>;


export type UpdatePatientTagsMutation = { __typename?: 'Mutation', updatepatientsCollection: { __typename?: 'patientsUpdateResponse', records: Array<{ __typename?: 'patients', id: string, tags?: Array<string | null> | null, updated_at?: any | null }> } };

export type GetAppointmentsQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<AppointmentsFilter>;
  orderBy?: InputMaybe<Array<AppointmentsOrderBy> | AppointmentsOrderBy>;
}>;


export type GetAppointmentsQuery = { __typename?: 'Query', appointmentsCollection?: { __typename?: 'appointmentsConnection', edges: Array<{ __typename?: 'appointmentsEdge', cursor: string, node: { __typename?: 'appointments', id: string, patient_id?: string | null, professional_id: string, clinic_id?: string | null, workspace_id?: string | null, appointment_date: string, start_time: any, end_time: any, appointment_type?: string | null, status?: string | null, reason?: string | null, notes?: string | null, internal_notes?: string | null, created_at?: any | null, updated_at?: any | null, is_recurring?: boolean | null, recurring_pattern?: any | null, reminder_sent?: boolean | null, reminder_date?: any | null, confirmation_sent?: boolean | null, confirmation_date?: any | null } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } | null };

export type GetAppointmentByIdQueryVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;


export type GetAppointmentByIdQuery = { __typename?: 'Query', appointmentsCollection?: { __typename?: 'appointmentsConnection', edges: Array<{ __typename?: 'appointmentsEdge', node: { __typename?: 'appointments', id: string, patient_id?: string | null, professional_id: string, clinic_id?: string | null, workspace_id?: string | null, appointment_date: string, start_time: any, end_time: any, appointment_type?: string | null, status?: string | null, reason?: string | null, notes?: string | null, internal_notes?: string | null, created_at?: any | null, updated_at?: any | null, is_recurring?: boolean | null, recurring_pattern?: any | null, reminder_sent?: boolean | null, reminder_date?: any | null, confirmation_sent?: boolean | null, confirmation_date?: any | null } }> } | null };

export type GetAppointmentsWithPatientQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  filter?: InputMaybe<AppointmentsFilter>;
  orderBy?: InputMaybe<Array<AppointmentsOrderBy> | AppointmentsOrderBy>;
}>;


export type GetAppointmentsWithPatientQuery = { __typename?: 'Query', appointmentsCollection?: { __typename?: 'appointmentsConnection', edges: Array<{ __typename?: 'appointmentsEdge', cursor: string, node: { __typename?: 'appointments', id: string, appointment_date: string, start_time: any, end_time: any, status?: string | null, appointment_type?: string | null, reason?: string | null, notes?: string | null, patients?: { __typename?: 'patients', id: string, first_name: string, last_name?: string | null, paternal_last_name?: string | null, maternal_last_name?: string | null, email?: string | null, phone?: string | null } | null } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } | null };

export type GetAppointmentsByDateRangeQueryVariables = Exact<{
  startDate: Scalars['Date']['input'];
  endDate: Scalars['Date']['input'];
  clinicId?: InputMaybe<Scalars['UUID']['input']>;
  professionalId?: InputMaybe<Scalars['UUID']['input']>;
}>;


export type GetAppointmentsByDateRangeQuery = { __typename?: 'Query', appointmentsCollection?: { __typename?: 'appointmentsConnection', edges: Array<{ __typename?: 'appointmentsEdge', node: { __typename?: 'appointments', id: string, patient_id?: string | null, appointment_date: string, start_time: any, end_time: any, status?: string | null, appointment_type?: string | null, reason?: string | null, notes?: string | null } }> } | null };

export type GetTodayAppointmentsQueryVariables = Exact<{
  date: Scalars['Date']['input'];
  clinicId?: InputMaybe<Scalars['UUID']['input']>;
}>;


export type GetTodayAppointmentsQuery = { __typename?: 'Query', appointmentsCollection?: { __typename?: 'appointmentsConnection', edges: Array<{ __typename?: 'appointmentsEdge', node: { __typename?: 'appointments', id: string, patient_id?: string | null, start_time: any, end_time: any, status?: string | null, appointment_type?: string | null, reason?: string | null, notes?: string | null, patients?: { __typename?: 'patients', id: string, first_name: string, last_name?: string | null, paternal_last_name?: string | null, phone?: string | null } | null } }> } | null };

export type GetAppointmentsByPatientQueryVariables = Exact<{
  patientId: Scalars['UUID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetAppointmentsByPatientQuery = { __typename?: 'Query', appointmentsCollection?: { __typename?: 'appointmentsConnection', edges: Array<{ __typename?: 'appointmentsEdge', cursor: string, node: { __typename?: 'appointments', id: string, appointment_date: string, start_time: any, end_time: any, status?: string | null, appointment_type?: string | null, reason?: string | null, notes?: string | null, created_at?: any | null } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } | null };

export type GetDailyAppointmentStatsQueryVariables = Exact<{
  date: Scalars['Date']['input'];
  clinicId?: InputMaybe<Scalars['UUID']['input']>;
}>;


export type GetDailyAppointmentStatsQuery = { __typename?: 'Query', appointmentsCollection?: { __typename?: 'appointmentsConnection', edges: Array<{ __typename?: 'appointmentsEdge', node: { __typename?: 'appointments', id: string, status?: string | null, appointment_type?: string | null } }> } | null };

export type GetPatientsQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<PatientsFilter>;
  orderBy?: InputMaybe<Array<PatientsOrderBy> | PatientsOrderBy>;
}>;


export type GetPatientsQuery = { __typename?: 'Query', patientsCollection?: { __typename?: 'patientsConnection', edges: Array<{ __typename?: 'patientsEdge', cursor: string, node: { __typename?: 'patients', id: string, first_name: string, last_name?: string | null, paternal_last_name?: string | null, maternal_last_name?: string | null, email?: string | null, phone?: string | null, date_of_birth?: string | null, gender?: string | null, blood_type?: string | null, emergency_contact?: string | null, emergency_phone?: string | null, address?: string | null, city?: string | null, state?: string | null, postal_code?: string | null, occupation?: string | null, marital_status?: string | null, is_active?: boolean | null, created_at?: any | null, updated_at?: any | null, clinic_id?: string | null } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } | null };

export type GetPatientByIdQueryVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;


export type GetPatientByIdQuery = { __typename?: 'Query', patientsCollection?: { __typename?: 'patientsConnection', edges: Array<{ __typename?: 'patientsEdge', node: { __typename?: 'patients', id: string, first_name: string, last_name?: string | null, paternal_last_name?: string | null, maternal_last_name?: string | null, email?: string | null, phone?: string | null, date_of_birth?: string | null, gender?: string | null, blood_type?: string | null, emergency_contact?: string | null, emergency_phone?: string | null, address?: string | null, city?: string | null, state?: string | null, postal_code?: string | null, occupation?: string | null, marital_status?: string | null, medical_history?: string | null, current_medications?: Array<string | null> | null, allergies?: Array<string | null> | null, chronic_conditions?: Array<string | null> | null, insurance_provider?: string | null, insurance_number?: string | null, is_active?: boolean | null, notes?: string | null, tags?: Array<string | null> | null, created_at?: any | null, updated_at?: any | null, clinic_id?: string | null } }> } | null };

export type GetPatientWithAppointmentsQueryVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;


export type GetPatientWithAppointmentsQuery = { __typename?: 'Query', patientsCollection?: { __typename?: 'patientsConnection', edges: Array<{ __typename?: 'patientsEdge', node: { __typename?: 'patients', id: string, first_name: string, last_name?: string | null, paternal_last_name?: string | null, maternal_last_name?: string | null, email?: string | null, phone?: string | null, appointmentsCollection?: { __typename?: 'appointmentsConnection', edges: Array<{ __typename?: 'appointmentsEdge', node: { __typename?: 'appointments', id: string, appointment_date: string, status?: string | null, notes?: string | null, created_at?: any | null } }> } | null } }> } | null };

export type SearchPatientsQueryVariables = Exact<{
  searchText: Scalars['String']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type SearchPatientsQuery = { __typename?: 'Query', patientsCollection?: { __typename?: 'patientsConnection', edges: Array<{ __typename?: 'patientsEdge', cursor: string, node: { __typename?: 'patients', id: string, first_name: string, last_name?: string | null, paternal_last_name?: string | null, maternal_last_name?: string | null, email?: string | null, phone?: string | null, date_of_birth?: string | null, gender?: string | null, is_active?: boolean | null } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } | null };


export const CreatePatientDocument = gql`
    mutation CreatePatient($input: patientsInsertInput!) {
  insertIntopatientsCollection(objects: [$input]) {
    records {
      id
      first_name
      last_name
      paternal_last_name
      maternal_last_name
      email
      phone
      date_of_birth
      gender
      blood_type
      emergency_contact
      emergency_phone
      address
      city
      state
      postal_code
      occupation
      marital_status
      is_active
      created_at
      clinic_id
    }
  }
}
    `;
export type CreatePatientMutationFn = Apollo.MutationFunction<CreatePatientMutation, CreatePatientMutationVariables>;

/**
 * __useCreatePatientMutation__
 *
 * To run a mutation, you first call `useCreatePatientMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePatientMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPatientMutation, { data, loading, error }] = useCreatePatientMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreatePatientMutation(baseOptions?: Apollo.MutationHookOptions<CreatePatientMutation, CreatePatientMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreatePatientMutation, CreatePatientMutationVariables>(CreatePatientDocument, options);
      }
export type CreatePatientMutationHookResult = ReturnType<typeof useCreatePatientMutation>;
export type CreatePatientMutationResult = Apollo.MutationResult<CreatePatientMutation>;
export type CreatePatientMutationOptions = Apollo.BaseMutationOptions<CreatePatientMutation, CreatePatientMutationVariables>;
export const UpdatePatientDocument = gql`
    mutation UpdatePatient($id: UUID!, $input: patientsUpdateInput!) {
  updatepatientsCollection(filter: {id: {eq: $id}}, set: $input) {
    records {
      id
      first_name
      last_name
      paternal_last_name
      maternal_last_name
      email
      phone
      date_of_birth
      gender
      blood_type
      emergency_contact
      emergency_phone
      address
      city
      state
      postal_code
      occupation
      marital_status
      medical_history
      current_medications
      allergies
      chronic_conditions
      insurance_provider
      insurance_number
      is_active
      notes
      tags
      updated_at
      clinic_id
    }
  }
}
    `;
export type UpdatePatientMutationFn = Apollo.MutationFunction<UpdatePatientMutation, UpdatePatientMutationVariables>;

/**
 * __useUpdatePatientMutation__
 *
 * To run a mutation, you first call `useUpdatePatientMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePatientMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePatientMutation, { data, loading, error }] = useUpdatePatientMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdatePatientMutation(baseOptions?: Apollo.MutationHookOptions<UpdatePatientMutation, UpdatePatientMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdatePatientMutation, UpdatePatientMutationVariables>(UpdatePatientDocument, options);
      }
export type UpdatePatientMutationHookResult = ReturnType<typeof useUpdatePatientMutation>;
export type UpdatePatientMutationResult = Apollo.MutationResult<UpdatePatientMutation>;
export type UpdatePatientMutationOptions = Apollo.BaseMutationOptions<UpdatePatientMutation, UpdatePatientMutationVariables>;
export const UpdatePatientBasicInfoDocument = gql`
    mutation UpdatePatientBasicInfo($id: UUID!, $input: patientsUpdateInput!) {
  updatepatientsCollection(filter: {id: {eq: $id}}, set: $input) {
    records {
      id
      first_name
      last_name
      paternal_last_name
      maternal_last_name
      email
      phone
      date_of_birth
      gender
      blood_type
      address
      city
      state
      postal_code
      occupation
      marital_status
      updated_at
    }
  }
}
    `;
export type UpdatePatientBasicInfoMutationFn = Apollo.MutationFunction<UpdatePatientBasicInfoMutation, UpdatePatientBasicInfoMutationVariables>;

/**
 * __useUpdatePatientBasicInfoMutation__
 *
 * To run a mutation, you first call `useUpdatePatientBasicInfoMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePatientBasicInfoMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePatientBasicInfoMutation, { data, loading, error }] = useUpdatePatientBasicInfoMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdatePatientBasicInfoMutation(baseOptions?: Apollo.MutationHookOptions<UpdatePatientBasicInfoMutation, UpdatePatientBasicInfoMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdatePatientBasicInfoMutation, UpdatePatientBasicInfoMutationVariables>(UpdatePatientBasicInfoDocument, options);
      }
export type UpdatePatientBasicInfoMutationHookResult = ReturnType<typeof useUpdatePatientBasicInfoMutation>;
export type UpdatePatientBasicInfoMutationResult = Apollo.MutationResult<UpdatePatientBasicInfoMutation>;
export type UpdatePatientBasicInfoMutationOptions = Apollo.BaseMutationOptions<UpdatePatientBasicInfoMutation, UpdatePatientBasicInfoMutationVariables>;
export const TogglePatientStatusDocument = gql`
    mutation TogglePatientStatus($id: UUID!, $isActive: Boolean!) {
  updatepatientsCollection(filter: {id: {eq: $id}}, set: {is_active: $isActive}) {
    records {
      id
      first_name
      last_name
      is_active
      updated_at
    }
  }
}
    `;
export type TogglePatientStatusMutationFn = Apollo.MutationFunction<TogglePatientStatusMutation, TogglePatientStatusMutationVariables>;

/**
 * __useTogglePatientStatusMutation__
 *
 * To run a mutation, you first call `useTogglePatientStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useTogglePatientStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [togglePatientStatusMutation, { data, loading, error }] = useTogglePatientStatusMutation({
 *   variables: {
 *      id: // value for 'id'
 *      isActive: // value for 'isActive'
 *   },
 * });
 */
export function useTogglePatientStatusMutation(baseOptions?: Apollo.MutationHookOptions<TogglePatientStatusMutation, TogglePatientStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<TogglePatientStatusMutation, TogglePatientStatusMutationVariables>(TogglePatientStatusDocument, options);
      }
export type TogglePatientStatusMutationHookResult = ReturnType<typeof useTogglePatientStatusMutation>;
export type TogglePatientStatusMutationResult = Apollo.MutationResult<TogglePatientStatusMutation>;
export type TogglePatientStatusMutationOptions = Apollo.BaseMutationOptions<TogglePatientStatusMutation, TogglePatientStatusMutationVariables>;
export const DeletePatientDocument = gql`
    mutation DeletePatient($id: UUID!) {
  updatepatientsCollection(filter: {id: {eq: $id}}, set: {is_active: false}) {
    records {
      id
      first_name
      last_name
      is_active
      updated_at
    }
  }
}
    `;
export type DeletePatientMutationFn = Apollo.MutationFunction<DeletePatientMutation, DeletePatientMutationVariables>;

/**
 * __useDeletePatientMutation__
 *
 * To run a mutation, you first call `useDeletePatientMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeletePatientMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deletePatientMutation, { data, loading, error }] = useDeletePatientMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeletePatientMutation(baseOptions?: Apollo.MutationHookOptions<DeletePatientMutation, DeletePatientMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeletePatientMutation, DeletePatientMutationVariables>(DeletePatientDocument, options);
      }
export type DeletePatientMutationHookResult = ReturnType<typeof useDeletePatientMutation>;
export type DeletePatientMutationResult = Apollo.MutationResult<DeletePatientMutation>;
export type DeletePatientMutationOptions = Apollo.BaseMutationOptions<DeletePatientMutation, DeletePatientMutationVariables>;
export const UpdatePatientNotesDocument = gql`
    mutation UpdatePatientNotes($id: UUID!, $notes: String!) {
  updatepatientsCollection(filter: {id: {eq: $id}}, set: {notes: $notes}) {
    records {
      id
      notes
      updated_at
    }
  }
}
    `;
export type UpdatePatientNotesMutationFn = Apollo.MutationFunction<UpdatePatientNotesMutation, UpdatePatientNotesMutationVariables>;

/**
 * __useUpdatePatientNotesMutation__
 *
 * To run a mutation, you first call `useUpdatePatientNotesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePatientNotesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePatientNotesMutation, { data, loading, error }] = useUpdatePatientNotesMutation({
 *   variables: {
 *      id: // value for 'id'
 *      notes: // value for 'notes'
 *   },
 * });
 */
export function useUpdatePatientNotesMutation(baseOptions?: Apollo.MutationHookOptions<UpdatePatientNotesMutation, UpdatePatientNotesMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdatePatientNotesMutation, UpdatePatientNotesMutationVariables>(UpdatePatientNotesDocument, options);
      }
export type UpdatePatientNotesMutationHookResult = ReturnType<typeof useUpdatePatientNotesMutation>;
export type UpdatePatientNotesMutationResult = Apollo.MutationResult<UpdatePatientNotesMutation>;
export type UpdatePatientNotesMutationOptions = Apollo.BaseMutationOptions<UpdatePatientNotesMutation, UpdatePatientNotesMutationVariables>;
export const UpdatePatientTagsDocument = gql`
    mutation UpdatePatientTags($id: UUID!, $tags: [String]!) {
  updatepatientsCollection(filter: {id: {eq: $id}}, set: {tags: $tags}) {
    records {
      id
      tags
      updated_at
    }
  }
}
    `;
export type UpdatePatientTagsMutationFn = Apollo.MutationFunction<UpdatePatientTagsMutation, UpdatePatientTagsMutationVariables>;

/**
 * __useUpdatePatientTagsMutation__
 *
 * To run a mutation, you first call `useUpdatePatientTagsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePatientTagsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePatientTagsMutation, { data, loading, error }] = useUpdatePatientTagsMutation({
 *   variables: {
 *      id: // value for 'id'
 *      tags: // value for 'tags'
 *   },
 * });
 */
export function useUpdatePatientTagsMutation(baseOptions?: Apollo.MutationHookOptions<UpdatePatientTagsMutation, UpdatePatientTagsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdatePatientTagsMutation, UpdatePatientTagsMutationVariables>(UpdatePatientTagsDocument, options);
      }
export type UpdatePatientTagsMutationHookResult = ReturnType<typeof useUpdatePatientTagsMutation>;
export type UpdatePatientTagsMutationResult = Apollo.MutationResult<UpdatePatientTagsMutation>;
export type UpdatePatientTagsMutationOptions = Apollo.BaseMutationOptions<UpdatePatientTagsMutation, UpdatePatientTagsMutationVariables>;
export const GetAppointmentsDocument = gql`
    query GetAppointments($first: Int, $after: Cursor, $filter: appointmentsFilter, $orderBy: [appointmentsOrderBy!]) {
  appointmentsCollection(
    first: $first
    after: $after
    filter: $filter
    orderBy: $orderBy
  ) {
    edges {
      node {
        id
        patient_id
        professional_id
        clinic_id
        workspace_id
        appointment_date
        start_time
        end_time
        appointment_type
        status
        reason
        notes
        internal_notes
        created_at
        updated_at
        is_recurring
        recurring_pattern
        reminder_sent
        reminder_date
        confirmation_sent
        confirmation_date
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
    `;

/**
 * __useGetAppointmentsQuery__
 *
 * To run a query within a React component, call `useGetAppointmentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAppointmentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAppointmentsQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      filter: // value for 'filter'
 *      orderBy: // value for 'orderBy'
 *   },
 * });
 */
export function useGetAppointmentsQuery(baseOptions?: Apollo.QueryHookOptions<GetAppointmentsQuery, GetAppointmentsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAppointmentsQuery, GetAppointmentsQueryVariables>(GetAppointmentsDocument, options);
      }
export function useGetAppointmentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAppointmentsQuery, GetAppointmentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAppointmentsQuery, GetAppointmentsQueryVariables>(GetAppointmentsDocument, options);
        }
export function useGetAppointmentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetAppointmentsQuery, GetAppointmentsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetAppointmentsQuery, GetAppointmentsQueryVariables>(GetAppointmentsDocument, options);
        }
export type GetAppointmentsQueryHookResult = ReturnType<typeof useGetAppointmentsQuery>;
export type GetAppointmentsLazyQueryHookResult = ReturnType<typeof useGetAppointmentsLazyQuery>;
export type GetAppointmentsSuspenseQueryHookResult = ReturnType<typeof useGetAppointmentsSuspenseQuery>;
export type GetAppointmentsQueryResult = Apollo.QueryResult<GetAppointmentsQuery, GetAppointmentsQueryVariables>;
export const GetAppointmentByIdDocument = gql`
    query GetAppointmentById($id: UUID!) {
  appointmentsCollection(filter: {id: {eq: $id}}) {
    edges {
      node {
        id
        patient_id
        professional_id
        clinic_id
        workspace_id
        appointment_date
        start_time
        end_time
        appointment_type
        status
        reason
        notes
        internal_notes
        created_at
        updated_at
        is_recurring
        recurring_pattern
        reminder_sent
        reminder_date
        confirmation_sent
        confirmation_date
      }
    }
  }
}
    `;

/**
 * __useGetAppointmentByIdQuery__
 *
 * To run a query within a React component, call `useGetAppointmentByIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAppointmentByIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAppointmentByIdQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetAppointmentByIdQuery(baseOptions: Apollo.QueryHookOptions<GetAppointmentByIdQuery, GetAppointmentByIdQueryVariables> & ({ variables: GetAppointmentByIdQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAppointmentByIdQuery, GetAppointmentByIdQueryVariables>(GetAppointmentByIdDocument, options);
      }
export function useGetAppointmentByIdLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAppointmentByIdQuery, GetAppointmentByIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAppointmentByIdQuery, GetAppointmentByIdQueryVariables>(GetAppointmentByIdDocument, options);
        }
export function useGetAppointmentByIdSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetAppointmentByIdQuery, GetAppointmentByIdQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetAppointmentByIdQuery, GetAppointmentByIdQueryVariables>(GetAppointmentByIdDocument, options);
        }
export type GetAppointmentByIdQueryHookResult = ReturnType<typeof useGetAppointmentByIdQuery>;
export type GetAppointmentByIdLazyQueryHookResult = ReturnType<typeof useGetAppointmentByIdLazyQuery>;
export type GetAppointmentByIdSuspenseQueryHookResult = ReturnType<typeof useGetAppointmentByIdSuspenseQuery>;
export type GetAppointmentByIdQueryResult = Apollo.QueryResult<GetAppointmentByIdQuery, GetAppointmentByIdQueryVariables>;
export const GetAppointmentsWithPatientDocument = gql`
    query GetAppointmentsWithPatient($first: Int, $filter: appointmentsFilter, $orderBy: [appointmentsOrderBy!]) {
  appointmentsCollection(first: $first, filter: $filter, orderBy: $orderBy) {
    edges {
      node {
        id
        appointment_date
        start_time
        end_time
        status
        appointment_type
        reason
        notes
        patients {
          id
          first_name
          last_name
          paternal_last_name
          maternal_last_name
          email
          phone
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
    `;

/**
 * __useGetAppointmentsWithPatientQuery__
 *
 * To run a query within a React component, call `useGetAppointmentsWithPatientQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAppointmentsWithPatientQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAppointmentsWithPatientQuery({
 *   variables: {
 *      first: // value for 'first'
 *      filter: // value for 'filter'
 *      orderBy: // value for 'orderBy'
 *   },
 * });
 */
export function useGetAppointmentsWithPatientQuery(baseOptions?: Apollo.QueryHookOptions<GetAppointmentsWithPatientQuery, GetAppointmentsWithPatientQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAppointmentsWithPatientQuery, GetAppointmentsWithPatientQueryVariables>(GetAppointmentsWithPatientDocument, options);
      }
export function useGetAppointmentsWithPatientLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAppointmentsWithPatientQuery, GetAppointmentsWithPatientQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAppointmentsWithPatientQuery, GetAppointmentsWithPatientQueryVariables>(GetAppointmentsWithPatientDocument, options);
        }
export function useGetAppointmentsWithPatientSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetAppointmentsWithPatientQuery, GetAppointmentsWithPatientQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetAppointmentsWithPatientQuery, GetAppointmentsWithPatientQueryVariables>(GetAppointmentsWithPatientDocument, options);
        }
export type GetAppointmentsWithPatientQueryHookResult = ReturnType<typeof useGetAppointmentsWithPatientQuery>;
export type GetAppointmentsWithPatientLazyQueryHookResult = ReturnType<typeof useGetAppointmentsWithPatientLazyQuery>;
export type GetAppointmentsWithPatientSuspenseQueryHookResult = ReturnType<typeof useGetAppointmentsWithPatientSuspenseQuery>;
export type GetAppointmentsWithPatientQueryResult = Apollo.QueryResult<GetAppointmentsWithPatientQuery, GetAppointmentsWithPatientQueryVariables>;
export const GetAppointmentsByDateRangeDocument = gql`
    query GetAppointmentsByDateRange($startDate: Date!, $endDate: Date!, $clinicId: UUID, $professionalId: UUID) {
  appointmentsCollection(
    filter: {and: [{appointment_date: {gte: $startDate}}, {appointment_date: {lte: $endDate}}, {clinic_id: {eq: $clinicId}}, {professional_id: {eq: $professionalId}}]}
    orderBy: [{appointment_date: AscNullsFirst}, {start_time: AscNullsFirst}]
  ) {
    edges {
      node {
        id
        patient_id
        appointment_date
        start_time
        end_time
        status
        appointment_type
        reason
        notes
      }
    }
  }
}
    `;

/**
 * __useGetAppointmentsByDateRangeQuery__
 *
 * To run a query within a React component, call `useGetAppointmentsByDateRangeQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAppointmentsByDateRangeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAppointmentsByDateRangeQuery({
 *   variables: {
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *      clinicId: // value for 'clinicId'
 *      professionalId: // value for 'professionalId'
 *   },
 * });
 */
export function useGetAppointmentsByDateRangeQuery(baseOptions: Apollo.QueryHookOptions<GetAppointmentsByDateRangeQuery, GetAppointmentsByDateRangeQueryVariables> & ({ variables: GetAppointmentsByDateRangeQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAppointmentsByDateRangeQuery, GetAppointmentsByDateRangeQueryVariables>(GetAppointmentsByDateRangeDocument, options);
      }
export function useGetAppointmentsByDateRangeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAppointmentsByDateRangeQuery, GetAppointmentsByDateRangeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAppointmentsByDateRangeQuery, GetAppointmentsByDateRangeQueryVariables>(GetAppointmentsByDateRangeDocument, options);
        }
export function useGetAppointmentsByDateRangeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetAppointmentsByDateRangeQuery, GetAppointmentsByDateRangeQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetAppointmentsByDateRangeQuery, GetAppointmentsByDateRangeQueryVariables>(GetAppointmentsByDateRangeDocument, options);
        }
export type GetAppointmentsByDateRangeQueryHookResult = ReturnType<typeof useGetAppointmentsByDateRangeQuery>;
export type GetAppointmentsByDateRangeLazyQueryHookResult = ReturnType<typeof useGetAppointmentsByDateRangeLazyQuery>;
export type GetAppointmentsByDateRangeSuspenseQueryHookResult = ReturnType<typeof useGetAppointmentsByDateRangeSuspenseQuery>;
export type GetAppointmentsByDateRangeQueryResult = Apollo.QueryResult<GetAppointmentsByDateRangeQuery, GetAppointmentsByDateRangeQueryVariables>;
export const GetTodayAppointmentsDocument = gql`
    query GetTodayAppointments($date: Date!, $clinicId: UUID) {
  appointmentsCollection(
    filter: {and: [{appointment_date: {eq: $date}}, {clinic_id: {eq: $clinicId}}]}
    orderBy: [{start_time: AscNullsFirst}]
  ) {
    edges {
      node {
        id
        patient_id
        start_time
        end_time
        status
        appointment_type
        reason
        notes
        patients {
          id
          first_name
          last_name
          paternal_last_name
          phone
        }
      }
    }
  }
}
    `;

/**
 * __useGetTodayAppointmentsQuery__
 *
 * To run a query within a React component, call `useGetTodayAppointmentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTodayAppointmentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTodayAppointmentsQuery({
 *   variables: {
 *      date: // value for 'date'
 *      clinicId: // value for 'clinicId'
 *   },
 * });
 */
export function useGetTodayAppointmentsQuery(baseOptions: Apollo.QueryHookOptions<GetTodayAppointmentsQuery, GetTodayAppointmentsQueryVariables> & ({ variables: GetTodayAppointmentsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetTodayAppointmentsQuery, GetTodayAppointmentsQueryVariables>(GetTodayAppointmentsDocument, options);
      }
export function useGetTodayAppointmentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetTodayAppointmentsQuery, GetTodayAppointmentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetTodayAppointmentsQuery, GetTodayAppointmentsQueryVariables>(GetTodayAppointmentsDocument, options);
        }
export function useGetTodayAppointmentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetTodayAppointmentsQuery, GetTodayAppointmentsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetTodayAppointmentsQuery, GetTodayAppointmentsQueryVariables>(GetTodayAppointmentsDocument, options);
        }
export type GetTodayAppointmentsQueryHookResult = ReturnType<typeof useGetTodayAppointmentsQuery>;
export type GetTodayAppointmentsLazyQueryHookResult = ReturnType<typeof useGetTodayAppointmentsLazyQuery>;
export type GetTodayAppointmentsSuspenseQueryHookResult = ReturnType<typeof useGetTodayAppointmentsSuspenseQuery>;
export type GetTodayAppointmentsQueryResult = Apollo.QueryResult<GetTodayAppointmentsQuery, GetTodayAppointmentsQueryVariables>;
export const GetAppointmentsByPatientDocument = gql`
    query GetAppointmentsByPatient($patientId: UUID!, $first: Int) {
  appointmentsCollection(
    filter: {patient_id: {eq: $patientId}}
    orderBy: [{appointment_date: DescNullsLast}]
    first: $first
  ) {
    edges {
      node {
        id
        appointment_date
        start_time
        end_time
        status
        appointment_type
        reason
        notes
        created_at
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
    `;

/**
 * __useGetAppointmentsByPatientQuery__
 *
 * To run a query within a React component, call `useGetAppointmentsByPatientQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAppointmentsByPatientQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAppointmentsByPatientQuery({
 *   variables: {
 *      patientId: // value for 'patientId'
 *      first: // value for 'first'
 *   },
 * });
 */
export function useGetAppointmentsByPatientQuery(baseOptions: Apollo.QueryHookOptions<GetAppointmentsByPatientQuery, GetAppointmentsByPatientQueryVariables> & ({ variables: GetAppointmentsByPatientQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAppointmentsByPatientQuery, GetAppointmentsByPatientQueryVariables>(GetAppointmentsByPatientDocument, options);
      }
export function useGetAppointmentsByPatientLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAppointmentsByPatientQuery, GetAppointmentsByPatientQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAppointmentsByPatientQuery, GetAppointmentsByPatientQueryVariables>(GetAppointmentsByPatientDocument, options);
        }
export function useGetAppointmentsByPatientSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetAppointmentsByPatientQuery, GetAppointmentsByPatientQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetAppointmentsByPatientQuery, GetAppointmentsByPatientQueryVariables>(GetAppointmentsByPatientDocument, options);
        }
export type GetAppointmentsByPatientQueryHookResult = ReturnType<typeof useGetAppointmentsByPatientQuery>;
export type GetAppointmentsByPatientLazyQueryHookResult = ReturnType<typeof useGetAppointmentsByPatientLazyQuery>;
export type GetAppointmentsByPatientSuspenseQueryHookResult = ReturnType<typeof useGetAppointmentsByPatientSuspenseQuery>;
export type GetAppointmentsByPatientQueryResult = Apollo.QueryResult<GetAppointmentsByPatientQuery, GetAppointmentsByPatientQueryVariables>;
export const GetDailyAppointmentStatsDocument = gql`
    query GetDailyAppointmentStats($date: Date!, $clinicId: UUID) {
  appointmentsCollection(
    filter: {and: [{appointment_date: {eq: $date}}, {clinic_id: {eq: $clinicId}}]}
  ) {
    edges {
      node {
        id
        status
        appointment_type
      }
    }
  }
}
    `;

/**
 * __useGetDailyAppointmentStatsQuery__
 *
 * To run a query within a React component, call `useGetDailyAppointmentStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDailyAppointmentStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDailyAppointmentStatsQuery({
 *   variables: {
 *      date: // value for 'date'
 *      clinicId: // value for 'clinicId'
 *   },
 * });
 */
export function useGetDailyAppointmentStatsQuery(baseOptions: Apollo.QueryHookOptions<GetDailyAppointmentStatsQuery, GetDailyAppointmentStatsQueryVariables> & ({ variables: GetDailyAppointmentStatsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetDailyAppointmentStatsQuery, GetDailyAppointmentStatsQueryVariables>(GetDailyAppointmentStatsDocument, options);
      }
export function useGetDailyAppointmentStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetDailyAppointmentStatsQuery, GetDailyAppointmentStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetDailyAppointmentStatsQuery, GetDailyAppointmentStatsQueryVariables>(GetDailyAppointmentStatsDocument, options);
        }
export function useGetDailyAppointmentStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetDailyAppointmentStatsQuery, GetDailyAppointmentStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetDailyAppointmentStatsQuery, GetDailyAppointmentStatsQueryVariables>(GetDailyAppointmentStatsDocument, options);
        }
export type GetDailyAppointmentStatsQueryHookResult = ReturnType<typeof useGetDailyAppointmentStatsQuery>;
export type GetDailyAppointmentStatsLazyQueryHookResult = ReturnType<typeof useGetDailyAppointmentStatsLazyQuery>;
export type GetDailyAppointmentStatsSuspenseQueryHookResult = ReturnType<typeof useGetDailyAppointmentStatsSuspenseQuery>;
export type GetDailyAppointmentStatsQueryResult = Apollo.QueryResult<GetDailyAppointmentStatsQuery, GetDailyAppointmentStatsQueryVariables>;
export const GetPatientsDocument = gql`
    query GetPatients($first: Int, $after: Cursor, $filter: patientsFilter, $orderBy: [patientsOrderBy!]) {
  patientsCollection(
    first: $first
    after: $after
    filter: $filter
    orderBy: $orderBy
  ) {
    edges {
      node {
        id
        first_name
        last_name
        paternal_last_name
        maternal_last_name
        email
        phone
        date_of_birth
        gender
        blood_type
        emergency_contact
        emergency_phone
        address
        city
        state
        postal_code
        occupation
        marital_status
        is_active
        created_at
        updated_at
        clinic_id
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
    `;

/**
 * __useGetPatientsQuery__
 *
 * To run a query within a React component, call `useGetPatientsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPatientsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPatientsQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      filter: // value for 'filter'
 *      orderBy: // value for 'orderBy'
 *   },
 * });
 */
export function useGetPatientsQuery(baseOptions?: Apollo.QueryHookOptions<GetPatientsQuery, GetPatientsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPatientsQuery, GetPatientsQueryVariables>(GetPatientsDocument, options);
      }
export function useGetPatientsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPatientsQuery, GetPatientsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPatientsQuery, GetPatientsQueryVariables>(GetPatientsDocument, options);
        }
export function useGetPatientsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPatientsQuery, GetPatientsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetPatientsQuery, GetPatientsQueryVariables>(GetPatientsDocument, options);
        }
export type GetPatientsQueryHookResult = ReturnType<typeof useGetPatientsQuery>;
export type GetPatientsLazyQueryHookResult = ReturnType<typeof useGetPatientsLazyQuery>;
export type GetPatientsSuspenseQueryHookResult = ReturnType<typeof useGetPatientsSuspenseQuery>;
export type GetPatientsQueryResult = Apollo.QueryResult<GetPatientsQuery, GetPatientsQueryVariables>;
export const GetPatientByIdDocument = gql`
    query GetPatientById($id: UUID!) {
  patientsCollection(filter: {id: {eq: $id}}) {
    edges {
      node {
        id
        first_name
        last_name
        paternal_last_name
        maternal_last_name
        email
        phone
        date_of_birth
        gender
        blood_type
        emergency_contact
        emergency_phone
        address
        city
        state
        postal_code
        occupation
        marital_status
        medical_history
        current_medications
        allergies
        chronic_conditions
        insurance_provider
        insurance_number
        is_active
        notes
        tags
        created_at
        updated_at
        clinic_id
      }
    }
  }
}
    `;

/**
 * __useGetPatientByIdQuery__
 *
 * To run a query within a React component, call `useGetPatientByIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPatientByIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPatientByIdQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetPatientByIdQuery(baseOptions: Apollo.QueryHookOptions<GetPatientByIdQuery, GetPatientByIdQueryVariables> & ({ variables: GetPatientByIdQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPatientByIdQuery, GetPatientByIdQueryVariables>(GetPatientByIdDocument, options);
      }
export function useGetPatientByIdLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPatientByIdQuery, GetPatientByIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPatientByIdQuery, GetPatientByIdQueryVariables>(GetPatientByIdDocument, options);
        }
export function useGetPatientByIdSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPatientByIdQuery, GetPatientByIdQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetPatientByIdQuery, GetPatientByIdQueryVariables>(GetPatientByIdDocument, options);
        }
export type GetPatientByIdQueryHookResult = ReturnType<typeof useGetPatientByIdQuery>;
export type GetPatientByIdLazyQueryHookResult = ReturnType<typeof useGetPatientByIdLazyQuery>;
export type GetPatientByIdSuspenseQueryHookResult = ReturnType<typeof useGetPatientByIdSuspenseQuery>;
export type GetPatientByIdQueryResult = Apollo.QueryResult<GetPatientByIdQuery, GetPatientByIdQueryVariables>;
export const GetPatientWithAppointmentsDocument = gql`
    query GetPatientWithAppointments($id: UUID!) {
  patientsCollection(filter: {id: {eq: $id}}) {
    edges {
      node {
        id
        first_name
        last_name
        paternal_last_name
        maternal_last_name
        email
        phone
        appointmentsCollection {
          edges {
            node {
              id
              appointment_date
              status
              notes
              created_at
            }
          }
        }
      }
    }
  }
}
    `;

/**
 * __useGetPatientWithAppointmentsQuery__
 *
 * To run a query within a React component, call `useGetPatientWithAppointmentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPatientWithAppointmentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPatientWithAppointmentsQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetPatientWithAppointmentsQuery(baseOptions: Apollo.QueryHookOptions<GetPatientWithAppointmentsQuery, GetPatientWithAppointmentsQueryVariables> & ({ variables: GetPatientWithAppointmentsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPatientWithAppointmentsQuery, GetPatientWithAppointmentsQueryVariables>(GetPatientWithAppointmentsDocument, options);
      }
export function useGetPatientWithAppointmentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPatientWithAppointmentsQuery, GetPatientWithAppointmentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPatientWithAppointmentsQuery, GetPatientWithAppointmentsQueryVariables>(GetPatientWithAppointmentsDocument, options);
        }
export function useGetPatientWithAppointmentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPatientWithAppointmentsQuery, GetPatientWithAppointmentsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetPatientWithAppointmentsQuery, GetPatientWithAppointmentsQueryVariables>(GetPatientWithAppointmentsDocument, options);
        }
export type GetPatientWithAppointmentsQueryHookResult = ReturnType<typeof useGetPatientWithAppointmentsQuery>;
export type GetPatientWithAppointmentsLazyQueryHookResult = ReturnType<typeof useGetPatientWithAppointmentsLazyQuery>;
export type GetPatientWithAppointmentsSuspenseQueryHookResult = ReturnType<typeof useGetPatientWithAppointmentsSuspenseQuery>;
export type GetPatientWithAppointmentsQueryResult = Apollo.QueryResult<GetPatientWithAppointmentsQuery, GetPatientWithAppointmentsQueryVariables>;
export const SearchPatientsDocument = gql`
    query SearchPatients($searchText: String!, $first: Int) {
  patientsCollection(
    first: $first
    filter: {or: [{first_name: {ilike: $searchText}}, {last_name: {ilike: $searchText}}, {paternal_last_name: {ilike: $searchText}}, {maternal_last_name: {ilike: $searchText}}, {email: {ilike: $searchText}}, {phone: {ilike: $searchText}}]}
    orderBy: [{first_name: AscNullsFirst}]
  ) {
    edges {
      node {
        id
        first_name
        last_name
        paternal_last_name
        maternal_last_name
        email
        phone
        date_of_birth
        gender
        is_active
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
    `;

/**
 * __useSearchPatientsQuery__
 *
 * To run a query within a React component, call `useSearchPatientsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchPatientsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchPatientsQuery({
 *   variables: {
 *      searchText: // value for 'searchText'
 *      first: // value for 'first'
 *   },
 * });
 */
export function useSearchPatientsQuery(baseOptions: Apollo.QueryHookOptions<SearchPatientsQuery, SearchPatientsQueryVariables> & ({ variables: SearchPatientsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SearchPatientsQuery, SearchPatientsQueryVariables>(SearchPatientsDocument, options);
      }
export function useSearchPatientsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SearchPatientsQuery, SearchPatientsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SearchPatientsQuery, SearchPatientsQueryVariables>(SearchPatientsDocument, options);
        }
export function useSearchPatientsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SearchPatientsQuery, SearchPatientsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SearchPatientsQuery, SearchPatientsQueryVariables>(SearchPatientsDocument, options);
        }
export type SearchPatientsQueryHookResult = ReturnType<typeof useSearchPatientsQuery>;
export type SearchPatientsLazyQueryHookResult = ReturnType<typeof useSearchPatientsLazyQuery>;
export type SearchPatientsSuspenseQueryHookResult = ReturnType<typeof useSearchPatientsSuspenseQuery>;
export type SearchPatientsQueryResult = Apollo.QueryResult<SearchPatientsQuery, SearchPatientsQueryVariables>;