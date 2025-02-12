class APIFeatures{
    constructor(query,queryString){
        this.query=query;
        this.queryString=queryString;
    }
    filter(){
        const queryObj={...this.queryString};                                 // cloned from req.query
        const excludedFileds=['page','sort','limit','fields'];       // exclude the fileds
        excludedFileds.forEach(el => delete queryObj[el]);           // for loop on filed and delete them
     // Operators 
     // 1B)Advenced Filtering
        let queryStr=JSON.stringify(queryObj);
        queryStr=queryStr.replace(/\b(gt|gte|lte|lt)\b/g,match => `$${match}`);
        //console.log(JSON.parse(queryStr));
    
       this.query= this.query.find(JSON.parse(queryStr));
        //let query= Tour.find(JSON.parse(queryStr));          // after filtering from fileds that exsist in the array
    
        return this;        
    }
    sort(){
        if(this.queryString.sort){
            const sortBy=this.queryString.sort.split(',').join(' ');
            this.query=this.query.sort(sortBy);
        }else{
            this.query=this.query.sort('-createdAt');
        }
       return this;
    }
    limitFields(){
        if(this.queryString.fields){
            const fields =this.queryString.fields.split(',').join(' ');
            this.query=this.query.select(fields);
        }
        else {
            this.query=this.query.select('-__v');
        }
    return this;
    }
    pagination(){
        const page =+(this.queryString.page) || 1;
        const limit = +(this.queryString.limit) ||100;
        const skip =(page-1)*limit;
    
    
        //page =2,limit =10: page1 =1:10 , page2 =11:20 , page3 =21:30
        this.query =this.query.skip(skip).limit(limit);
       return this;
    }
}

module.exports=APIFeatures;