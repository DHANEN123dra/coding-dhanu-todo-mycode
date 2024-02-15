const express = require("express")
const sqlite3 = require("sqlite3")
const {open} = require("sqlite")
const path = require("path")
const dbPath = path.join(__dirname,"todoApplication.db")
const app = express()
app.use(express.json())
let db =null
const intilizeDbAndServer = async ()=>{
try {
    db = await open({
        filename:dbPath,
        driver:sqlite3.Database,
    })
    app.listen(3000,()=>{
        console.log("Server Running Sucesfully")
    })
}
catch(error){
    console.log(`DB Error:${error.message}`)
    process.exit(1)

}
}

intilizeDbAndServer()

const hasPriorityAndStatusProperties = (requestQuery)=>{
    return (requestQuery.priority !== undefined && requestQuery.status!==undefined);
};

const hasPriorityProperty = (requestQuery)=>{
    return (requestQuery.priority !== undefined);
};

const hasStatusProperty = (requestQuery)=>{
    return (requestQuery.status !== undefined);
}

app.get("/todos/", async (request,response)=>{

    let data=null;

    const{search_q='',priority,status} = request.query

    let getTodoQuery="";

     switch (true){

        case hasPriorityAndStatusProperties(request.query):
                getTodoQuery = `
                     SELECT
                       *
                     FROM
                      todo
                     WHERE
                      todo LIKE '%${search_q}%'
                      AND status='${status}'
                      AND priority ='${priority}';`;
        break;
         
        case hasPriorityProperty(request.query):
        getTodoQuery = `
                     SELECT
                       *
                     FROM
                      todo
                     WHERE
                      todo LIKE '%${search_q}%'
                      AND priority ='${priority}';`;
        break;

        case hasStatusProperty(request.query):
        getTodoQuery = `
                     SELECT
                       *
                     FROM
                      todo
                     WHERE
                      todo LIKE '%${search_q}%'
                      AND status ='${status}';`;
        break;

        default:
        getTodoQuery = `
                     SELECT
                       *
                     FROM
                      todo
                     WHERE
                      todo LIKE '%${search_q}%';`;
    }
    data = await db.all(getTodoQuery)
    response.send(data)
});

app.get("/todos/:todoId/", async (request,response)=>{
    const{todoId}=request.params
    const getTodosByTodoIdQuery = `
    SELECT
      *
    FROM
     todo
    WHERE
     id = ${todoId};`

     let todos = await db.get(getTodosByTodoIdQuery)
     response.send(todos)
});

app.post("/todos/", async (request,response)=>{
    const {id,todo,priority,status} = request.body
    const postTodoQuery = `
    INSERT INTO
     todo (id,todo,priority,status)
    VALUES
     (${id},'${todo}','${priority}','${status}');`
    
    await db.run(postTodoQuery)
    response.send("Todo Successfully Added")

});

app.put("/todos/:todoId/", async (request,response)=>{
    const requestBody = request.body
    const {todoId} = request.params
    let updatedColumn = ""

    switch (true){
        case requestBody.status !== undefined:
        updatedColumn="Status"
        break;

        case requestBody.priority !== undefined:
        updatedColumn="Priority"
        break;

        case requestBody.todo !== undefined:
        updatedColumn="todo"
        break;
    }

     const previousTodoQuery = 
    `
    SELECT
      *
    FROM
     todo
    WHERE
     id = ${todoId};`

     const previousTodo = await db.get(previousTodoQuery);

     const {todo = previousTodo.todo,
            priority=previousTodo.priority,
            status=previousTodo.status} = request.body

     const updateColumnQuery = 
     `UPDATE
       todo
      SET
       todo = '${todo}',
       priority = '${priority}',
       status = '${status}'
      WHERE
       id = ${todoId};`

    await db.run(updateColumnQuery)
    response.send(`${updatedColumn} Updated`)
});

app.delete ("/todos/:todoId/", async (request,response)=>{
    const{todoId} = request.params
    const deleteQuery = 
    `
    DELETE FROM
     todo
    WHERE
     id = ${todoId};`

     await db.run(deleteQuery)
     response.send("Todo Deleted")
});

module.exports = app;
