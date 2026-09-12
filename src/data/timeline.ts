// A fictional today/tomorrow calendar, with no personal birthday or age.
export function getBirthdayState(now=new Date()){return {state:'normal',year:now.getFullYear(),season:1,age:0,yearsKnown:0};}
