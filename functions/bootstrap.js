// Centrale Functions-loader: behoud bestaande functies en voeg veilige Hunt-codefuncties toe.
module.exports = {
  ...require('./index'),
  ...require('./hunt-codes')
};
