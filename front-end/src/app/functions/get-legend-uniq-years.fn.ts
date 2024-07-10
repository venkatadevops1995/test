import * as _ from 'lodash';
export function getLegendUniqYears(data) {
    let years = _.uniq(data.map(item=>{
        if(typeof item.label == 'number'){
            let date = new Date(item.label)
            return date.getFullYear();
        }else{
            return null
        }
      })) 
      years = years.sort();
      let legendStr = years.reduce((acc,item,index)=>{
        if(index == 0){
          acc += item+"";
        }else {
          acc += " - "+String(item).substr(2,2);
        }
        return acc;
      },"")
      return legendStr;
}