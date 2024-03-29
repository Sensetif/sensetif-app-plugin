import React from 'react';
import { Button, HorizontalGroup, Input } from '@grafana/ui';

type SecretInputProps = React.ComponentProps<typeof Input> & {
  /** Defines if the password is already set or not. (It is needed as in some cases the backend doesn't send back the actual password) */
  isConfigured: boolean;
  /** Called when the user clicks on the "Reset" button */
  onReset: () => void;
};

// This replaces the "LegacyForms.SecretFormField" component from @grafana/ui, so we can start using the newer form components.
export const SecretInput = ({ isConfigured, onReset, ...props }: SecretInputProps) => {
  if (isConfigured) {
    return (
      <HorizontalGroup>
        <Input {...props} type="text" disabled={true} value="configured" />
        <Button onClick={onReset} variant="secondary">
          Reset
        </Button>
      </HorizontalGroup>
    );
  }

  return <Input {...props} type="password" />;
};
