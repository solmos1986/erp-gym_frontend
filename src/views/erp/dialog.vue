<div class="flex flex-col md:flex-row gap-8">
                <div class="md:w-1/2">
                    <div class="grid grid-cols-2 gap-2 mb-3">
                        <div><label for="sku" class="block font-bold mb-3">SKU</label> <InputText id="sku" v-model="form.sku" required="true" class="w-full" /></div>
                        <div>
                            <label for="name" class="block font-bold mb-3">Tipo producto</label>
                            <InputGroup><Dropdown v-model="form.productType" :options="enums" optionLabel="label" optionValue="value" placeholder="Seleccionar tipo" class="mr-2" /></InputGroup>
                        </div>
                    </div>
                    <div class="flex flex-col mb-3">
                        <div><label for="name" class="block font-bold mb-3 l">Nombre</label> <InputText id="name" v-model="form.name" required="true" class="w-full" /></div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 mb-3">
                        <div><label for="name" class="block font-bold mb-3">Precio compra</label> <InputText v-model="form.purchasePrice" id="name" required="true" class="w-full" /></div>
                        <div><label for="name" class="block font-bold mb-3">Precio venta</label> <InputText v-model="form.salePrice" id="name" required="true" class="w-full" /></div>
                    </div>
                </div>
                <div class="md:w-1/2">
                    <div class="flex flex-col items-center">
                        <h6 class="block font-bold mb-3">Imagen del producto</h6>

                        <!-- CONTENEDOR FIJO DE LA IMAGEN -->
                        <div class="w-56 h-56 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50 mb-3">
                            <img v-if="imagePreview" :src="imagePreview" class="max-w-full max-h-full object-contain" />
                            <span v-else class="text-gray-400 text-sm">Sin imagen</span>
                        </div>

                        <!-- BOTONES -->
                        <div class="flex items-center gap-3">
                            <FileUpload mode="basic" name="image" accept="image/*" chooseLabel="Elegir imagen" @select="onImageSelect" customUpload />

                            <Button v-if="imagePreview" label="Quitar" icon="pi pi-times" severity="danger" text @click="removeImage" />
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex justify-between flex-col md:flex-row gap-8 mb-3">
                <div class="grid grid-cols-4 gap-3 w-full">
                    <div>
                        <label class="block font-bold mb-3 l">Clasificacion</label>
                        <InputGroup>
                            <Button label="+" @click="showTypeModal = true" />
                            <Dropdown v-model="form.typeId" :options="types" optionLabel="name" optionValue="id" />
                        </InputGroup>
                    </div>

                    <div>
                        <label class="block font-bold mb-3 l">Categoría</label>
                        <InputGroup>
                            <Button label="+" :disabled="!form.typeId" @click="showCategoryModal = true" />
                            <Dropdown v-model="form.categoryId" :disabled="!form.typeId" :options="categories" optionLabel="name" optionValue="id" />
                        </InputGroup>
                    </div>

                    <div>
                        <label class="block font-bold mb-3 l">Subcategoría</label>
                        <InputGroup>
                            <Button label="+" :disabled="!form.categoryId" @click="showSubCategoryModal = true" />
                            <Dropdown v-model="form.subcategoryId" :disabled="!form.categoryId" :options="subCategories" optionLabel="name" optionValue="id" />
                        </InputGroup>
                    </div>

                    <div>
                        <label class="block font-bold mb-3 l">Marca</label>
                        <InputGroup>
                            <Button label="+" @click="showBrandModal = true" />
                            <Dropdown v-model="form.brandId" :options="brands" optionLabel="name" optionValue="id" />
                        </InputGroup>
                    </div>
                </div>
            </div>
            <div class="flex justify-end gap-6">
                <Button label="Cancelar" text @click="dialogVisible = false" />
                <Button label="Guardar" :disabled="editingProduct ? !canUpdate : !canCreate" @click="save" />
            </div>
