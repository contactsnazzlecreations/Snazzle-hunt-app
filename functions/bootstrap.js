// Centrale Functions-loader: behoud bestaande functies en voeg beveiligde functies toe.
module.exports = {
  ...require('./index'),
  ...require('./hunt-codes'),
  ...require('./meetups'),
  ...require('./admin-mfa'),
  ...require('./org-hunts'),
  ...require('./card-progress'),
  ...require('./card-state'),
  // Deze laatste export vervangt uitsluitend redeemOrgAccessCode door de strengere guard.
  ...require('./org-access-guard')
};