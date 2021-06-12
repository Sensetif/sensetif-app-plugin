import React, { FC } from 'react';
import { AppRootProps } from '@grafana/data';
import { addDatapoint } from 'utils/api';
import { DatapointForm } from 'forms/DatapointForm';

export const AddDatapoint: FC<AppRootProps> = ({ query }) => {
  const projectName = query['project'];
  const subsystemName = query['subsystem'];

  return (
    <>
      <DatapointForm
        onSubmit={(datapoint) => {
          console.log(datapoint);
          addDatapoint(projectName, subsystemName, datapoint);
        }}
      />
    </>
  );
};