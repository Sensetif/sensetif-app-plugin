import React, { FC } from 'react';
import {
  AuthenticationType,
  DatapointSettings,
  OriginDocumentFormat,
  PollInterval,
  ScalingFunction,
  TimestampType,
  TimeToLive,
} from '../types';
import {
  Button,
  Field,
  FieldSet,
  Form,
  HorizontalGroup,
  Input,
  InputControl,
  RadioButtonGroup,
  Select,
} from '@grafana/ui';

interface Props {
  editable?: boolean;
  datapoint?: DatapointSettings;
  onSubmit: (data: DatapointSettings, event?: React.BaseSyntheticEvent) => void | Promise<void>;
}

export const DatapointForm: FC<Props> = ({ editable, datapoint, onSubmit }) => {
  return (
    <Form<DatapointSettings>
      onSubmit={onSubmit}
      defaultValues={{
        name: datapoint?.name,
        format: datapoint?.format,
        url: datapoint?.url,
        unit: datapoint?.unit,
        valueExpression: datapoint?.valueExpression,
      }}
    >
      {({ register, errors, control, watch }) => {
        const authType = watch('authType');
        const format = watch('format');

        return (
          <>
            <FieldSet label="Datapoint details">
              <Field label="Name" invalid={!!errors.name} error={errors.name && errors.name.message}>
                <Input
                  type="url"
                  disabled={!editable}
                  placeholder="Project name"
                  name="name"
                  ref={register({
                    required: 'Project name is required',
                    pattern: { value: /[a-z][A-Za-z0-9_]*/, message: 'Allowed letters, numbers and characters: _, * ' },
                  })}
                />
              </Field>

              <Field
                label="Poll interval"
                invalid={!!errors.interval}
                error={errors.interval && errors.interval.message}
              >
                <InputControl
                  disabled={!editable}
                  as={Select}
                  rules={{
                    required: 'Interval selection is required',
                  }}
                  name="interval"
                  options={[
                    { label: '5 minutes', value: PollInterval.a },
                    { label: '10 minutes', value: PollInterval.b },
                    { label: '15 minutes', value: PollInterval.c },
                    { label: '30 minutes', value: PollInterval.d },
                    { label: '1 hour', value: PollInterval.e },
                    { label: '3 hours', value: PollInterval.f },
                    { label: '6 hours', value: PollInterval.g },
                    { label: '12 hours', value: PollInterval.h },
                    { label: '24 hours', value: PollInterval.i },
                  ]}
                  control={control}
                />
              </Field>

              <Field label="URL" invalid={!!errors.url} error={errors.url && errors.url.message}>
                <Input
                  disabled={!editable}
                  placeholder="Datapoint URL"
                  name="url"
                  ref={register({
                    required: 'URL is required',
                  })}
                />
              </Field>
            </FieldSet>

            {/* auth */}
            <FieldSet label="Auhorization">
              <Field
                label="Authentication type"
                invalid={!!errors.authenticationType}
                error={errors.authenticationType && errors.authenticationType.message}
              >
                <InputControl
                  as={RadioButtonGroup}
                  rules={{
                    required: 'Auth selection is required',
                  }}
                  options={[
                    { label: 'User & Password', value: AuthenticationType.userpass },
                    { label: 'Authorization key', value: AuthenticationType.authorizationKey },
                  ]}
                  control={control}
                  defaultValue={AuthenticationType.userpass}
                  name="authType"
                />
              </Field>

              {authType === AuthenticationType.userpass && (
                <>
                  <Field
                    label="Username"
                    invalid={!!errors.username}
                    error={errors.username && errors.username.message}
                  >
                    <Input
                      disabled={!editable}
                      placeholder="Username"
                      name="username"
                      ref={register({
                        required: 'Username is required',
                      })}
                    />
                  </Field>
                  <Field
                    label="Password"
                    invalid={!!errors.password}
                    error={errors.password && errors.password.message}
                  >
                    <Input
                      type="password"
                      disabled={!editable}
                      placeholder="Password"
                      name="password"
                      ref={register({
                        required: 'Password name is required',
                      })}
                    />
                  </Field>
                </>
              )}
              {authType === AuthenticationType.authorizationKey && (
                <Field
                  label="Authorization key"
                  invalid={!!errors.authKey}
                  error={errors.authKey && errors.authKey.message}
                >
                  <Input
                    disabled={!editable}
                    placeholder="Key"
                    name="authKey"
                    ref={register({
                      required: 'Key is required',
                    })}
                  />
                </Field>
              )}
            </FieldSet>

            <FieldSet label="Field format">
              <Field label="Format" invalid={!!errors.format} error={errors.format && errors.format.message}>
                <InputControl
                  as={RadioButtonGroup}
                  rules={{
                    required: 'Format selection is required',
                  }}
                  options={[
                    { label: 'json', value: OriginDocumentFormat.json },
                    { label: 'xml', value: OriginDocumentFormat.xml },
                  ]}
                  control={control}
                  defaultValue={OriginDocumentFormat.json}
                  name="format"
                />
              </Field>
              <Field
                label={format === OriginDocumentFormat.json ? 'JSON Path' : 'XPath'}
                invalid={!!errors.valueExpression}
                error={errors.valueExpression && errors.valueExpression.message}
              >
                <Input
                  disabled={!editable}
                  placeholder={format === OriginDocumentFormat.json ? 'JSON Path' : 'XPath'}
                  name="valueExpression"
                  ref={register({
                    required: 'expression is required',
                  })}
                />
              </Field>

              <Field label="Point Unit" invalid={!!errors.unit} error={errors.unit && errors.unit.message}>
                <Input
                  disabled={!editable}
                  placeholder="unit"
                  name="unit"
                  ref={register({
                    required: 'Unit is required',
                  })}
                />
              </Field>
            </FieldSet>

            <FieldSet label="Scalling">
              <HorizontalGroup>
                <Field label="Function" invalid={!!errors.scaling} error={errors.scaling && errors.scaling.message}>
                  <InputControl
                    as={Select}
                    rules={{
                      required: 'Function selection is required',
                    }}
                    options={[
                      { label: 'lin', value: ScalingFunction.lin },
                      { label: 'log', value: ScalingFunction.log },
                      { label: 'exp', value: ScalingFunction.exp },
                      { label: 'rad', value: ScalingFunction.rad },
                      { label: 'deg', value: ScalingFunction.deg },
                      { label: 'fToC', value: ScalingFunction.fToC },
                      { label: 'cToF', value: ScalingFunction.cToF },
                      { label: 'kToC', value: ScalingFunction.kToC },
                      { label: 'cToK', value: ScalingFunction.cToK },
                      { label: 'fToK', value: ScalingFunction.fToK },
                      { label: 'kTof', value: ScalingFunction.kTof },
                    ]}
                    control={control}
                    defaultValue={OriginDocumentFormat.json}
                    name="scaling"
                  />
                </Field>
                <Field label="k">
                  <Input disabled={!editable} type="number" name="k" />
                </Field>
                <Field label="m">
                  <Input disabled={!editable} type="number" name="m" />
                </Field>
              </HorizontalGroup>
            </FieldSet>

            <FieldSet label="Timestamp">
              <Field
                label="Type"
                invalid={!!errors.timestampType}
                error={errors.timestampType && errors.timestampType.message}
              >
                <InputControl
                  as={Select}
                  rules={{
                    required: 'TTL selection is required',
                  }}
                  options={[
                    { label: 'epoch millis', value: TimestampType.epochMillis },
                    { label: 'epoch seconds', value: TimestampType.epochSeconds },
                    { label: 'iso8601 zoned', value: TimestampType.iso8601_zoned },
                    { label: 'iso8601 offset', value: TimestampType.iso8601_offset },
                  ]}
                  control={control}
                  defaultValue={TimestampType.epochMillis}
                  name="timeToLive"
                />
              </Field>
              <Field
                label="Timestamp expression"
                invalid={!!errors.timestampExpression}
                error={errors.timestampExpression && errors.timestampExpression.message}
              >
                <Input
                  disabled={!editable}
                  placeholder={format === OriginDocumentFormat.json ? 'JSON Path' : 'XPath'}
                  name="timestampExpression"
                  ref={register({
                    required: 'expression is required',
                  })}
                />
              </Field>
              <Field label="Time To Live" invalid={!!errors.scaling} error={errors.scaling && errors.scaling.message}>
                <InputControl
                  as={Select}
                  rules={{
                    required: 'TTL selection is required',
                  }}
                  options={[
                    { label: '3 months', value: TimeToLive.a },
                    { label: '6 months', value: TimeToLive.b },
                    { label: '1 year', value: TimeToLive.c },
                    { label: '2 years', value: TimeToLive.d },
                    { label: '3 years', value: TimeToLive.e },
                    { label: '4 years', value: TimeToLive.f },
                    { label: '5 years', value: TimeToLive.g },
                    { label: 'forever', value: TimeToLive.h },
                  ]}
                  control={control}
                  defaultValue={TimeToLive.a}
                  name="timeToLive"
                />
              </Field>
            </FieldSet>

            <Button type="submit">{editable ? 'Update' : 'Save'}</Button>
          </>
        );
      }}
    </Form>
  );
};