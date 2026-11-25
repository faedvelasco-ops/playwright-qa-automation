import { checkoutErrors } from './messages';

export type CustomerInfo = { firstName: string; lastName: string; postalCode: string };

export const validCustomer: CustomerInfo = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  postalCode: '06600',
};

/** Data-driven cases for the checkout form: one required field left empty per case. */
export const missingFieldCases: { field: keyof CustomerInfo; expectedError: string }[] = [
  { field: 'firstName', expectedError: checkoutErrors.firstNameRequired },
  { field: 'lastName', expectedError: checkoutErrors.lastNameRequired },
  { field: 'postalCode', expectedError: checkoutErrors.postalCodeRequired },
];
