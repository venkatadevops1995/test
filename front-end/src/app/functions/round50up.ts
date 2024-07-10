export const round50Up = function round50up(x) {
    // x + (50 - (x % 50 )
    return (x + (100 - (x % 100)));
}

export const roundOffToNearestMultiple16 = (x) => {
    x = parseInt(x,10);
    let remainder = x%16;
    if(0 === remainder  ){
        return x;
    }else if(remainder <= 8){
        return (x - remainder);
    }else{
        return (x + (16 - remainder));
    }
}