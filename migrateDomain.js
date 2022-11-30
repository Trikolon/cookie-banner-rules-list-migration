const fsPromise = require("fs").promises;

const _ = require("lodash");

const RULE_LIST_FILE_IN =
  "../cookie-banner-rules-list/cookie-banner-rules-list.json";
const RULE_LIST_FILE_OUT = "./out/cookie-banner-rules-list.json";

function isMatchingRule(ruleA, ruleB) {
  // TODO: This should take more rule fields into account.
  return (
    _.isEqual(ruleA.cookies, ruleB.cookies) &&
    _.isEqual(ruleA.click, ruleB.click)
  );
}

(async () => {
  // Load and parse the rules list.
  const ruleListStr = await fsPromise.readFile(RULE_LIST_FILE_IN, {
    encoding: "utf-8",
  });

  let ruleList;
  try {
    ruleList = JSON.parse(ruleListStr);
  } catch (error) {
    console.error("Error while parsing rule list", error);
    exitWithError("Invalid JSON");
  }

  console.debug("loaded!");

  let rulesOut = [];

  ruleList.data.forEach((rule) => {
    let found = false;

    for (let ruleOut of rulesOut) {
      // If the rules are similar enough merge then.
      if (isMatchingRule(rule, ruleOut)) {
        found = true;
        ruleOut.domains.push(rule.domain);
        break;
      }
    }

    if (!found) {
      // Migrate the domain field to domains and add rule to the map.
      rule.domains = [rule.domain];
      delete rule.domain;
      rulesOut.push(rule);
    }
  });

  await fsPromise.writeFile(
    RULE_LIST_FILE_OUT,
    JSON.stringify({
      ...ruleList,
      data: rulesOut,
    })
  );

  console.info({
    originalSize: ruleList.data.length,
    newSize: rulesOut.length,
    delta: rulesOut.length - ruleList.data.length,
  });

  console.debug(
    "out sorted by most domains",
    rulesOut.sort((ruleA, ruleB) => {
      return ruleB.domains.length - ruleA.domains.length;
    })
  );
})();
