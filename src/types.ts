export interface SensetifAppSettings {
  customText?: string;
  customCheckbox?: boolean;
}

export interface ProjectSettings {
  name: string; // validate regexp:[a-z][A-Za-z0-9_]*
  title: string; // allow all characters
  city: string; // allow all characters
  country: string; // country list?
  timezone: string; // "UTC" or {continent}/{city}, ex Europe/Stockholm
  geolocation: string; // geo coordinates
  subsystems: SubsystemSettings[];
}

export interface SubsystemSettings {
  project: string;
  name: string; // validate regexp:[a-z][A-Za-z0-9_]*
  title: string; // allow all characters
  locallocation: string; // allow all characters
  datapoints: DatapointSettings[];
}

export enum DatasourceType {
  web = 'web',
  ttnv3 = 'ttnv3',
}

export interface Processing {
  unit: string; // Allow all characters
  scaling: ScalingFunction;
  k: number;
  m: number;
  min: number;
  max: number;
  condition: string;
  scalefunc: string
}

export interface DatapointSettings {
  project: string;
  subsystem: string;
  name: string; // validate regexp:[a-z][A-Za-z0-9_.]*
  pollinterval: PollInterval;
  proc: Processing;
  timeToLive: TimeToLive;
  datasourcetype: DatasourceType;
  datasource: WebDatasource | Ttnv3Datasource;
}

export interface Ttnv3Datasource {
  zone: string;
  application: string;
  device: string;
  pointname: string;
  authorizationKey: string;
}

export interface WebDatasource {
  url: string; // validate URL, incl anchor and query arguments, but disallow user:pwd@

  // Authentication is going to need a lot in the future, but for now user/pass is fine
  authenticationType: AuthenticationType;
  auth?: {
    u: string;
    p: string;
  }; // If authenticationType===basic, then auth contains "u" and "p" for user and password.

  format: OriginDocumentFormat;
  valueExpression: string; // if format==xml, then xpath. if format==json, then jsonpath. If there is library available for validation, do that. If not, put in a function and we figure that out later.

  timestampType: TimestampType;
  timestampExpression: string; // if format==xml, then xpath. if format==json, then jsonpath.
}

export enum TimeToLive {
  a = 'a', // 3 months
  b = 'b', // 6 months
  c = 'c', // 1 year
  d = 'd', // 2 years
  e = 'e', // 3 years
  f = 'f', // 4 years
  g = 'g', // 5 years
  h = 'h', // forever
}

export enum TimestampType {
  epochMillis = 'epochMillis',
  epochSeconds = 'epochSeconds',
  iso8601_zoned = 'iso8601_zoned',
  iso8601_offset = 'iso8601_offset',
  polltime = 'polltime',
}

export enum ScalingFunction {
  /** f(x) = k * x + m */
  lin = 'lin',

  /** f(x) = k * ln(m*x) */
  log = 'log',

  /** f(x) = k * e^(m*x) */
  exp = 'exp',

  /** Inputs are degrees, to be converted to radians. */
  rad = 'rad',

  /** Input are radians, to be converted to degrees. */
  deg = 'deg',

  /** Input Fahrenheit, output Celsius */
  fToC = 'fToC',

  /** Input Celsius, output Fahrenheit */
  cToF = 'cToF',

  /** Input Kelvin, output Celsius */
  kToC = 'kToC',

  /** Input Celsius, output Kelvin */
  cToK = 'cToK',

  /** Input Fahrenheit, output Kelvin */
  fToK = 'fToK',

  /** Input Kelvin, output Fahrenheit */
  kToF = 'ktoF',
}

export enum PollInterval {
  one_minute = 'one_minute', // 1 minutes (do not show)
  five_minutes = 'five_minutes', // 5 minutes
  ten_minutes = 'ten_minutes', // 10 minutes
  fifteen_minutes = 'fifteen_minutes', // 15 minutes
  twenty_minutes = 'twenty_minutes', // 20 minutes
  thirty_minutes = 'thirty_minutes', // 30 minutes
  one_hour = 'one_hour', // 1 hours
  two_hours = 'two_hours', // 2 hours
  three_hours = 'three_hours', // 3 hours
  six_hours = 'six_hours', // 6 hours
  twelve_hours = 'twelve_hours', // 12 hours
  one_day = 'one_day', // 1 day
  weekly = 'weekly', // 1 week
  monthly = 'monthly', // 1 month
}

export enum OriginDocumentFormat {
  json = 'json',
  xml = 'xml',
}

export enum AuthenticationType {
  none = 'none',
  basic = 'basic',
  bearerToken = 'bearerToken',
}

export interface GlobalSettings {}
