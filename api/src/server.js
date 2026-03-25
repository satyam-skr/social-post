import app from './app.js'
import { connectDB } from './configs/db.js'
import env from './configs/env.js'


connectDB()
.then(()=>{
    app.listen(env.PORT, ()=>{
        console.log("server listening in at port ", env.PORT);
    })
})
.catch((error)=>{
    console.log("error connecting to database");
})
