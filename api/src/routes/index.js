const { Router } = require("express");
const API_KEY = process.env;
const axios = require("axios");
const { Recipes, Diets } = require(`../db`);
// require('.env').config();
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');

const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter)

// ------------------------- GET INFO------------------------------------------------------
const getApiInfo = async () => {
  const apiUrl = await axios.get(
    `https://api.spoonacular.com/recipes/complexSearch?apiKey=5020846b508548b1b1d8754f11e57f7a&addRecipeInformation=true&number=100`
  );
  // const apiData = apiUrl.data.results;

  const apiInfo = await apiUrl.data.results.map((el) => {
    return {
      title: el.title,
      id: el.id,
      score: el.spoonacularScore,
      healtScore: el.healthScore,
      vegetarian: el.vegetarian,
      diets: el.diets.map((e) => {
        return e;
      }),
      image: el.image,
      dishTypes: el.dishTypes.map((e) => {
        return e;
      }),
      summary: el.summary,
      //  steps: el.analyzedInstructions,
    };
  });
  return apiInfo;
};

const getDbInfo = async () => {
  return await Recipes.findAll({
    include: {
      model: Diets,
      atributes: [`name`],
      through: {
        atributes: [],
      },
    },
  });
};

const getAllFoods = async () => {
  const apiInfo = await getApiInfo();
  const dbInfo = await getDbInfo();
  const allInfo = apiInfo.concat(dbInfo);

  return allInfo;
};

//-------------- getX Name-----------------funciona bien arreglar steps!!!!!!!!!!!!
//
//
router.get("/Food", async (req, res) => {
  const title = req.query.title;
  console.log(title);
  // console.log();
  // console.log(allInfo);
  const foodTotal = await getAllFoods();
  // console.log(foodTotal);
  if (title) {
    const foodName = foodTotal.filter((e) =>
      e.title.toLowerCase().includes(title.toLowerCase())
    );
    // console.log(foodName);
    foodName
      ? res.status(200).send(foodName)
      : res.status(404).send("no existe esa comida");
  } else {
    res.status(200).send(foodTotal);
  }
});
//
//
//
// ------------------GET X ID------------------------------------------------

router.get("/Food/:id", async (req, res) => {
  const id = req.params.id;
  console.log(id);
  const allFood = await getAllFoods();
  // console.log(allFood);
  if (id) {
    const foodId = allFood.find((item) => item.id === Number(id));
    console.log(foodId);
    foodId
      ? res.status(200).send(foodId)
      : res.status(404).send("hay foodId pero no se encontro el id");
  } else {
    res.status(200).send("no hay foodId, muestra todo", allFood);
  }
});

//
//
// -------------------------GET X Diets-------------------no anda , ver clase de selene---------------------------
router.get("/types", async (req, res) => {
  const diets = [
    "gluten free",
    "dairy free",
    "paleolithic",
    "ketogenic",
    "lacto ovo vegetarian",
    "vegan",
    "pescatarian",
    "primal",
    "fodmap friendly",
    "whole 30",
  ];

  diets.forEach((el) => {
    Diets.findOrCreate({
      where: { name: el },
    });
  });

  const allTypes = await Diets.findAll();
  res.send(allTypes);
});
//
//
//
//
// ------------------POST RECIPES-----------------
router.post("/Food", async (req, res) => {
  let { title, summary, score, healthScore, steps, diets, createdInDb } =
    req.body;
  console.log(title, summary, score, healthScore, steps, diets);
  let recipeCreated = await Recipes.create({
    title,
    summary,
    score,
    healthScore,
    steps,
    createdInDb,
  });

  for (let i = 0; i < diets.lenght; i++) {
    let diet = await Diets.findOne({
      where: { name: diets[i] },
    });
    recipeCreated.addDiets(diet);
  }
  res.send("se creo la receta");
});

module.exports = router;
